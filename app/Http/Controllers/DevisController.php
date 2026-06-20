<?php

namespace App\Http\Controllers;

use App\Models\Devis;
use App\Models\TauxTva;
use App\Models\DevisLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use Illuminate\Support\Str;

class DevisController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Devis::with(['tier', 'devise', 'commandes'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhere('commercial', 'like', "%{$search}%")
                  ->orWhereHas('tier', function ($tQ) use ($search) {
                      $tQ->where('label', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $devis = $query->paginate(10)->withQueryString();
        $entrepots = \App\Models\Entrepot::orderBy('label')->get();
        $products = \App\Models\Product::with(['saleUnit', 'stockUnit'])->where('status', 'actif')->orderBy('label')->get();

        return Inertia::render('Devis/Index', [
            'devis'     => $devis,
            'filters'   => $request->only('search', 'status'),
            'entrepots' => $entrepots,
            'products'  => $products,
            'branches'  => \App\Models\Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function create(): Response
    {
        // Get clients and prospects as potential tiers for estimate
        $tiers = Tier::whereIn('type', ['client', 'prospect'])
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $products = Product::where('status', 'actif')
            ->with(['saleUnit'])
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $units = Unit::orderBy('label')->get();
        $commercials = Employee::whereIn('type', ['commercial', 'agent'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
        $branches = \App\Models\Branche::orderBy('name')->get();

        return Inertia::render('Devis/Create', [
            'tiers'        => $tiers,
            'products'     => $products,
            'devises'      => $devises,
            'units'        => $units,
            'commercials'  => $commercials,
            'branches'     => $branches,
            'tauxTvas'     => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'         => ['required', 'exists:tiers,id'],
            'commercial'      => ['nullable', 'string', 'max:255'],
            'date_devis'      => ['required', 'date'],
            'duree_validite'  => ['required', 'integer', 'min:1'],
            'devise_id'       => ['required', 'exists:devises,id'],
            'branche_id'      => ['nullable', 'exists:branches,id'],
            'lines'           => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.sale_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'          => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'        => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'       => ['required', 'numeric', 'min:0'],
            'lines.*.remise'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'           => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request) {
            // Generate Reference automatically: DEV-YYYYMM-XXXX
            $date = date('Ym', strtotime($request->input('date_devis')));
            $count = Devis::whereYear('date_devis', date('Y', strtotime($request->input('date_devis'))))
                ->whereMonth('date_devis', date('m', strtotime($request->input('date_devis'))))
                ->count();
            
            $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            $ref = "DEV-{$date}-{$nextNum}";

            // Calculate totals
            $totalHt = 0;
            $totalTtc = 0;

            $linesData = [];

            // Pre-load all needed TauxTva records
            $tauxTvaIds = array_unique(array_filter(array_column($request->input('lines'), 'taux_tva_id')));
            $tauxTvas = TauxTva::whereIn('id', $tauxTvaIds)->get()->keyBy('id');

            foreach ($request->input('lines') as $line) {
                $qty = (double)$line['qty'];
                $puHt = (double)$line['pu_ht'];
                $tauxTvaId = $line['taux_tva_id'] ?? null;
                $taux = $tauxTvas[$tauxTvaId]->taux ?? 0;
                $tva    = (double)$taux;
                $remise = (double)($line['remise'] ?? 0);
                $rm = (double)($line['rm'] ?? 0);

                $lineHt = $qty * $puHt;
                $discount = ($lineHt * $remise / 100) + $rm;
                $lineTotalHt = max(0, $lineHt - $discount);
                $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                $totalHt += $lineTotalHt;
                $totalTtc += $lineTotalTtc;

                $linesData[] = [
                    'product_id'   => $line['product_id'],
                    'sale_unit_id' => $line['sale_unit_id'] ?? null,
                    'taux_tva_id'  => $tauxTvaId,
                    'tva'          => $tva,
                    'qty'          => $qty,
                    'pu_ht'        => $puHt,
                    'pu_ttc'       => $line['pu_ttc'],
                    'remise'       => $remise,
                    'rm'           => $rm,
                    'total_ht'     => $lineTotalHt,
                    'total_ttc'    => $lineTotalTtc,
                ];
            }

            $totalTva = max(0, $totalTtc - $totalHt);

            $devis = Devis::create([
                'ref'            => $ref,
                'tier_id'        => $request->input('tier_id'),
                'commercial'     => $request->input('commercial'),
                'date_devis'     => $request->input('date_devis'),
                'duree_validite' => $request->input('duree_validite'),
                'devise_id'      => $request->input('devise_id'),
                'branche_id'     => $request->input('branche_id'),
                'status'         => 'brouillon',
                'total_ht'       => $totalHt,
                'total_tva'      => $totalTva,
                'total_ttc'      => $totalTtc,
            ]);

            foreach ($linesData as $lData) {
                $devis->lines()->create($lData);
            }
        });

        return redirect()->route('devis.index')->with('success', 'Devis créé avec succès.');
    }

    public function edit(Devis $devis): Response
    {
        $devis->load(['lines.product', 'lines.saleUnit']);

        $tiers = Tier::whereIn('type', ['client', 'prospect'])
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $products = Product::where('status', 'actif')
            ->with(['saleUnit'])
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $units = Unit::orderBy('label')->get();
        $commercials = Employee::whereIn('type', ['commercial', 'agent'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
        $branches = \App\Models\Branche::orderBy('name')->get();

        return Inertia::render('Devis/Edit', [
            'devis'        => $devis,
            'tiers'        => $tiers,
            'products'     => $products,
            'devises'      => $devises,
            'units'        => $units,
            'commercials'  => $commercials,
            'branches'     => $branches,
            'tauxTvas'     => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function update(Request $request, Devis $devis): RedirectResponse
    {
        if (in_array($devis->status, ['commandé', 'commandé partiellement'])) {
            return back()->with('error', 'Un devis commandé ou partiellement commandé ne peut pas être modifié.');
        }

        $request->validate([
            'tier_id'         => ['required', 'exists:tiers,id'],
            'commercial'      => ['nullable', 'string', 'max:255'],
            'date_devis'      => ['required', 'date'],
            'duree_validite'  => ['required', 'integer', 'min:1'],
            'devise_id'       => ['required', 'exists:devises,id'],
            'branche_id'      => ['nullable', 'exists:branches,id'],
            'lines'           => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.sale_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'          => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'        => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'       => ['required', 'numeric', 'min:0'],
            'lines.*.remise'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'           => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $devis) {
            // Calculate totals
            $totalHt = 0;
            $totalTtc = 0;

            $linesData = [];

            // Pre-load all needed TauxTva records
            $tauxTvaIds = array_unique(array_filter(array_column($request->input('lines'), 'taux_tva_id')));
            $tauxTvas = TauxTva::whereIn('id', $tauxTvaIds)->get()->keyBy('id');

            foreach ($request->input('lines') as $line) {
                $qty = (double)$line['qty'];
                $puHt = (double)$line['pu_ht'];
                $tauxTvaId = $line['taux_tva_id'] ?? null;
                $taux = $tauxTvas[$tauxTvaId]->taux ?? 0;
                $tva    = (double)$taux;
                $remise = (double)($line['remise'] ?? 0);
                $rm = (double)($line['rm'] ?? 0);

                $lineHt = $qty * $puHt;
                $discount = ($lineHt * $remise / 100) + $rm;
                $lineTotalHt = max(0, $lineHt - $discount);
                $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                $totalHt += $lineTotalHt;
                $totalTtc += $lineTotalTtc;

                $linesData[] = [
                    'product_id'   => $line['product_id'],
                    'sale_unit_id' => $line['sale_unit_id'] ?? null,
                    'taux_tva_id'  => $tauxTvaId,
                    'tva'          => $tva,
                    'qty'          => $qty,
                    'pu_ht'        => $puHt,
                    'pu_ttc'       => $line['pu_ttc'],
                    'remise'       => $remise,
                    'rm'           => $rm,
                    'total_ht'     => $lineTotalHt,
                    'total_ttc'    => $lineTotalTtc,
                ];
            }

            $totalTva = max(0, $totalTtc - $totalHt);

            $devis->update([
                'tier_id'        => $request->input('tier_id'),
                'commercial'     => $request->input('commercial'),
                'date_devis'     => $request->input('date_devis'),
                'duree_validite' => $request->input('duree_validite'),
                'devise_id'      => $request->input('devise_id'),
                'branche_id'     => $request->input('branche_id'),
                'total_ht'       => $totalHt,
                'total_tva'      => $totalTva,
                'total_ttc'      => $totalTtc,
            ]);

            // Sync lines: delete old ones, write new ones
            $devis->lines()->delete();
            foreach ($linesData as $lData) {
                $devis->lines()->create($lData);
            }
        });

        return redirect()->route('devis.index')->with('success', 'Devis mis à jour.');
    }

    public function updateStatus(Request $request, Devis $devis): RedirectResponse
    {
        if (in_array($devis->status, ['commandé', 'commandé partiellement'])) {
            return back()->with('error', 'Le statut d\'un devis commandé ou partiellement commandé ne peut pas être modifié.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,envoyé,accepté,refusé,commandé,commandé partiellement'],
        ]);

        if (in_array($request->input('status'), ['commandé', 'commandé partiellement'])) {
            return back()->with('error', 'Le statut du devis ne peut pas être modifié manuellement vers commandé ou commandé partiellement.');
        }

        $devis->update([
            'status' => $request->input('status'),
        ]);

        return back()->with('success', 'Statut du devis mis à jour.');
    }

    public function exportTemplate()
    {
        $spreadsheet = new Spreadsheet();
        
        // Active data lists
        $activeTiers = Tier::whereIn('type', ['client', 'prospect'])
            ->where('status', 'actif')
            ->orderBy('label')
            ->pluck('label')
            ->toArray();
            
        $activeProducts = Product::where('status', 'actif')
            ->orderBy('label')
            ->pluck('label')
            ->toArray();
            
        $activeUnits = Unit::orderBy('code')
            ->pluck('code')
            ->toArray();

        // 1. Lists Sheet (Hidden)
        $listSheet = $spreadsheet->createSheet();
        $listSheet->setTitle('Lists');
        $listSheet->setSheetState(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet::SHEETSTATE_HIDDEN);

        // Populate Tiers (Col A)
        foreach ($activeTiers as $idx => $tierVal) {
            $listSheet->setCellValue('A' . ($idx + 1), $tierVal);
        }
        // Populate Products (Col B)
        foreach ($activeProducts as $idx => $prodVal) {
            $listSheet->setCellValue('B' . ($idx + 1), $prodVal);
        }
        // Populate Units (Col C)
        foreach ($activeUnits as $idx => $unitVal) {
            $listSheet->setCellValue('C' . ($idx + 1), $unitVal);
        }

        // 2. Active visible sheet (Devis template)
        $sheet = $spreadsheet->getSheet(0);
        $sheet->setTitle('DEV-0001');

        // Style header settings block
        $sheet->setCellValue('A1', 'Tiers (Client / Prospect)');
        $sheet->setCellValue('B1', count($activeTiers) > 0 ? $activeTiers[0] : ''); // default to first tier if exists
        $sheet->setCellValue('A2', 'Date de Devis (YYYY-MM-DD)');
        $sheet->setCellValue('B2', date('Y-m-d'));
        $sheet->setCellValue('A3', 'Durée de validité (Jours)');
        $sheet->setCellValue('B3', '30');
        $sheet->setCellValue('A4', 'Devise (Code, ex: MAD)');
        $sheet->setCellValue('B4', 'MAD');
        $sheet->setCellValue('A5', 'Commercial');
        $sheet->setCellValue('B5', '');

        // Label style
        $labelStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'], // Indigo-600
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ];

        // Format label rows
        $sheet->getStyle('A1:A5')->applyFromArray($labelStyle);
        $sheet->getStyle('B1:B5')->getFont()->setBold(true);

        // Product Line Headers (No "Référence Produit" anymore!)
        // Col A: Désignation Produit
        // Col B: Unité
        // Col C: Quantité
        // Col D: P.U. HT
        // Col E: TVA %
        // Col F: Remise %
        $sheet->setCellValue('A7', 'Désignation Produit');
        $sheet->setCellValue('B7', 'Unité');
        $sheet->setCellValue('C7', 'Quantité');
        $sheet->setCellValue('D7', 'P.U. HT');
        $sheet->setCellValue('E7', 'TVA %');
        $sheet->setCellValue('F7', 'Remise %');

        $tableHeaderStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'], // Slate-800
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '475569'],
                ],
            ],
        ];

        $sheet->getStyle('A7:F7')->applyFromArray($tableHeaderStyle);

        // Style cells
        $sheet->getStyle('C8:F100')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        
        // Auto size columns
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // --- Data Validations ---
        // Dropdown for B1 (Tiers)
        if (count($activeTiers) > 0) {
            $validation = $sheet->getCell('B1')->getDataValidation();
            $validation->setType(DataValidation::TYPE_LIST);
            $validation->setErrorStyle(DataValidation::STYLE_STOP);
            $validation->setAllowBlank(false);
            $validation->setShowInputMessage(true);
            $validation->setShowErrorMessage(true);
            $validation->setShowDropDown(true);
            $validation->setErrorTitle('Erreur');
            $validation->setError('Veuillez choisir un tiers valide de la liste.');
            $validation->setFormula1('Lists!$A$1:$A$' . count($activeTiers));
        }

        // Dropdowns for Column A (Products) and Column B (Units) from row 8 to 100
        for ($r = 8; $r <= 100; $r++) {
            if (count($activeProducts) > 0) {
                $validation = $sheet->getCell("A{$r}")->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
                $validation->setAllowBlank(true);
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setFormula1('Lists!$B$1:$B$' . count($activeProducts));
            }

            if (count($activeUnits) > 0) {
                $validation = $sheet->getCell("B{$r}")->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
                $validation->setAllowBlank(true);
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setFormula1('Lists!$C$1:$C$' . count($activeUnits));
            }
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'modele_import_devis.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . urlencode($filename) . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getRealPath());

        $errors = [];
        $importData = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $sheetName = $sheet->getTitle();
            if ($sheetName === 'Lists') {
                continue;
            }

            $tierLabel = trim($sheet->getCell('B1')->getValue() ?: '');
            $dateVal = $sheet->getCell('B2')->getValue();
            $dureeVal = $sheet->getCell('B3')->getValue();
            $deviseVal = $sheet->getCell('B4')->getValue();
            $commercial = trim($sheet->getCell('B5')->getValue() ?: '');

            // Check if sheet is completely empty to ignore it safely
            if (empty($tierLabel) && empty($dateVal) && empty($dureeVal) && empty($deviseVal) && empty($commercial)) {
                continue;
            }

            // 1. Validate Tier (Required)
            if (empty($tierLabel)) {
                $errors[] = "Feuille '{$sheetName}': Le tiers (B1) est obligatoire.";
                $tier = null;
            } else {
                $tier = Tier::where('label', $tierLabel)
                    ->whereIn('type', ['client', 'prospect'])
                    ->first();
                if (!$tier) {
                    $errors[] = "Feuille '{$sheetName}': Le tiers '{$tierLabel}' n'existe pas ou est inactif. Veuillez sélectionner un tiers valide de la liste.";
                }
            }

            // 2. Validate Date (Required)
            if (empty($dateVal)) {
                $errors[] = "Feuille '{$sheetName}': La date de devis (B2) est obligatoire.";
                $date = null;
            } else {
                if (\PhpOffice\PhpSpreadsheet\Shared\Date::isDateTime($sheet->getCell('B2'))) {
                    $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d');
                } else {
                    $timestamp = strtotime($dateVal);
                    if ($timestamp === false) {
                        $errors[] = "Feuille '{$sheetName}': La date de devis (B2) n'est pas au format valide (YYYY-MM-DD).";
                        $date = null;
                    } else {
                        $date = date('Y-m-d', $timestamp);
                    }
                }
            }

            // 3. Validate Validity Duration (Required, positive number)
            if ($dureeVal === null || $dureeVal === '' || !is_numeric($dureeVal) || (int)$dureeVal <= 0) {
                $errors[] = "Feuille '{$sheetName}': La durée de validité (B3) est obligatoire et doit être un nombre supérieur à 0.";
                $dureeValidite = null;
            } else {
                $dureeValidite = (int)$dureeVal;
            }

            // 4. Validate Devise (Required)
            $deviseCode = trim($deviseVal ?: '');
            if (empty($deviseCode)) {
                $errors[] = "Feuille '{$sheetName}': La devise (B4) est obligatoire.";
                $devise = null;
            } else {
                $devise = Devise::where('code', $deviseCode)->first();
                if (!$devise) {
                    $errors[] = "Feuille '{$sheetName}': La devise '{$deviseCode}' n'existe pas dans le système.";
                }
            }

            // 5. Parse and Validate Lines
            $row = 8;
            $lines = [];

            while (true) {
                $prodLabel = trim($sheet->getCell("A{$row}")->getValue() ?: '');
                $unitCode = trim($sheet->getCell("B{$row}")->getValue() ?: '');
                $qtyVal = $sheet->getCell("C{$row}")->getValue();
                $puVal = $sheet->getCell("D{$row}")->getValue();
                $tvaVal = $sheet->getCell("E{$row}")->getValue();
                $remiseVal = $sheet->getCell("F{$row}")->getValue();

                // If completely empty row, stop parsing lines
                if (empty($prodLabel) && empty($unitCode) && $qtyVal === null && $puVal === null && $tvaVal === null && $remiseVal === null) {
                    break;
                }

                // Designation is mandatory if any value is typed in the row
                if (empty($prodLabel)) {
                    $errors[] = "Feuille '{$sheetName}', Ligne {$row}: La désignation du produit (Colonne A) est obligatoire.";
                }

                // Unit is mandatory
                $saleUnitId = null;
                if (empty($unitCode)) {
                    $errors[] = "Feuille '{$sheetName}', Ligne {$row}: L'unité de vente (Colonne B) est obligatoire.";
                } else {
                    $unit = Unit::where('code', $unitCode)->orWhere('label', $unitCode)->first();
                    if ($unit) {
                        $saleUnitId = $unit->id;
                    } else {
                        $errors[] = "Feuille '{$sheetName}', Ligne {$row}: L'unité '{$unitCode}' n'existe pas dans le système.";
                    }
                }

                // Quantity is mandatory and positive
                if ($qtyVal === null || $qtyVal === '' || !is_numeric($qtyVal) || (double)$qtyVal <= 0) {
                    $errors[] = "Feuille '{$sheetName}', Ligne {$row}: La quantité (Colonne C) est obligatoire et doit être un nombre supérieur à 0.";
                    $qty = 0;
                } else {
                    $qty = (double)$qtyVal;
                }

                // P.U. HT is mandatory and non-negative
                if ($puVal === null || $puVal === '' || !is_numeric($puVal) || (double)$puVal < 0) {
                    $errors[] = "Feuille '{$sheetName}', Ligne {$row}: Le P.U. HT (Colonne D) est obligatoire et doit être un nombre supérieur ou égal à 0.";
                    $puHt = 0;
                } else {
                    $puHt = (double)$puVal;
                }

                // TVA % is mandatory and non-negative
                if ($tvaVal === null || $tvaVal === '' || !is_numeric($tvaVal) || (double)$tvaVal < 0) {
                    $errors[] = "Feuille '{$sheetName}', Ligne {$row}: Le taux de TVA % (Colonne E) est obligatoire et doit être un nombre supérieur ou égal à 0.";
                    $tva = 0;
                } else {
                    $tva = (double)$tvaVal;
                }

                // Remise % is optional but must be between 0 and 100 if specified
                $remise = 0.0;
                if ($remiseVal !== null && $remiseVal !== '') {
                    if (!is_numeric($remiseVal) || (double)$remiseVal < 0 || (double)$remiseVal > 100) {
                        $errors[] = "Feuille '{$sheetName}', Ligne {$row}: La remise % (Colonne F) doit être un nombre entre 0 et 100.";
                    } else {
                        $remise = (double)$remiseVal;
                    }
                }

                if (!empty($prodLabel) && $saleUnitId && $qty > 0 && $puHt >= 0 && $tva >= 0) {
                    $lines[] = [
                        'prodLabel' => $prodLabel,
                        'saleUnitId' => $saleUnitId,
                        'qty' => $qty,
                        'puHt' => $puHt,
                        'taux_tva_id'  => $tauxTvaId,
                'tva'          => $tva,
                        'remise' => $remise,
                    ];
                }

                $row++;
            }

            if (empty($lines)) {
                $errors[] = "Feuille '{$sheetName}': Le devis doit contenir au moins une ligne d'article valide.";
            }

            if (empty($errors) && $tier && $date && $dureeValidite && $devise && !empty($lines)) {
                $importData[] = [
                    'tier' => $tier,
                    'date' => $date,
                    'dureeValidite' => $dureeValidite,
                    'devise' => $devise,
                    'commercial' => $commercial,
                    'lines' => $lines,
                ];
            }
        }

        // If there are any validation errors, abort and return all of them
        if (!empty($errors)) {
            return back()->withErrors([
                'file' => "Erreurs de validation du fichier Excel :\n\n• " . implode("\n• ", $errors)
            ]);
        }

        if (empty($importData)) {
            return back()->withErrors([
                'file' => "Aucune feuille de devis valide à importer n'a été détectée."
            ]);
        }

        // Import successfully inside transaction
        $devisCount = 0;
        DB::transaction(function () use ($importData, &$devisCount) {
            foreach ($importData as $data) {
                $tier = $data['tier'];
                $date = $data['date'];
                $dureeValidite = $data['dureeValidite'];
                $devise = $data['devise'];
                $commercial = $data['commercial'];
                $rawLines = $data['lines'];

                $lines = [];
                foreach ($rawLines as $rl) {
                    // Find or Auto-Create Product
                    $product = Product::where('label', $rl['prodLabel'])->first();
                    if (!$product) {
                        $unit = \App\Models\Unit::find($rl['saleUnitId']);
                        $product = Product::create([
                            'label' => $rl['prodLabel'],
                            'ref' => 'P-' . strtoupper(Str::random(6)),
                            'sale_price' => $rl['puHt'],
                            'unit_category_id' => $unit ? $unit->unit_category_id : null,
                            'sale_unit_id' => $unit ? $unit->id : null,
                            'purchase_unit_id' => $unit ? $unit->id : null,
                            'stock_unit_id' => $unit ? $unit->id : null,
                            'purchase_price' => 0,
                            'status' => 'actif',
                        ]);
                    }

                    $saleUnitId = $rl['saleUnitId'] ?: $product->sale_unit_id;

                    // Calculations
                    $puTtc = $rl['puHt'] * (1 + $rl['tva'] / 100);
                    $lineHt = $rl['qty'] * $rl['puHt'];
                    $discount = ($lineHt * $rl['remise'] / 100);
                    $lineTotalHt = max(0, $lineHt - $discount);
                    $lineTotalTtc = $lineTotalHt * (1 + $rl['tva'] / 100);

                    $lines[] = [
                        'product_id' => $product->id,
                        'sale_unit_id' => $saleUnitId,
                        'tva' => $rl['tva'],
                        'qty' => $rl['qty'],
                        'pu_ht' => $rl['puHt'],
                        'pu_ttc' => $puTtc,
                        'remise' => $rl['remise'],
                        'rm' => $discount,
                        'total_ht' => $lineTotalHt,
                        'total_ttc' => $lineTotalTtc,
                    ];
                }

                // Reference Generation: DEV-YYYYMM-XXXX
                $dateObj = strtotime($date);
                $yearMonth = date('Ym', $dateObj);
                $count = Devis::whereYear('date_devis', date('Y', $dateObj))
                    ->whereMonth('date_devis', date('m', $dateObj))
                    ->count();
                
                $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
                $ref = "DEV-{$yearMonth}-{$nextNum}";

                $totalHt = array_sum(array_column($lines, 'total_ht'));
                $totalTtc = array_sum(array_column($lines, 'total_ttc'));
                $totalTva = max(0, $totalTtc - $totalHt);

                $devis = Devis::create([
                    'ref' => $ref,
                    'tier_id' => $tier->id,
                    'commercial' => $commercial,
                    'date_devis' => $date,
                    'duree_validite' => $dureeValidite,
                    'devise_id' => $devise->id,
                    'status' => 'brouillon',
                    'total_ht' => $totalHt,
                    'total_tva' => $totalTva,
                    'total_ttc' => $totalTtc,
                ]);

                // Pre-load all needed TauxTva records
        $tauxTvaIds = array_unique(array_filter(array_column($lines, 'taux_tva_id')));
        $tauxTvas = TauxTva::whereIn('id', $tauxTvaIds)->get()->keyBy('id');

        foreach ($lines as $line) {
                    $devis->lines()->create($line);
                }

                $devisCount++;
            }
        });

        return redirect()->route('devis.index')
            ->with('success', "Importation réussie : {$devisCount} devis importé(s) avec succès !");
    }

    public function destroy(Devis $devis): RedirectResponse
    {
        if (in_array($devis->status, ['commandé', 'commandé partiellement'])) {
            return back()->with('error', 'Un devis commandé ou partiellement commandé ne peut pas être supprimé.');
        }
        $devis->delete();
        return redirect()->route('devis.index')->with('success', 'Devis supprimé.');
    }

    public function getDevisWithLines(Devis $devis)
    {
        $devis->load(['lines.product.stockUnit', 'lines.product.saleUnit', 'lines.saleUnit', 'tier', 'devise']);
        return response()->json($devis);
    }
}
