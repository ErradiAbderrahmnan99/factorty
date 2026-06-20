<?php

namespace App\Http\Controllers;

use App\Models\DemandeAchat;
use App\Models\TauxTva;
use App\Models\DemandeAchatLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\CompteBancaire;
use App\Models\Branche;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DemandeAchatController extends Controller
{
    public function index(Request $request): Response
    {
        $query = DemandeAchat::with(['employee', 'tier', 'devise'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhereHas('employee', fn($eQ) => $eQ->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"))
                  ->orWhereHas('tier', fn($tQ) => $tQ->where('label', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('urgence')) {
            $query->where('urgence', $request->input('urgence'));
        }

        return Inertia::render('DemandeAchat/Index', [
            'demandes' => $query->paginate(10)->withQueryString(),
            'filters'  => $request->only('search', 'status', 'urgence'),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('DemandeAchat/Create', [
            'employees'           => Employee::orderBy('last_name')->orderBy('first_name')->get(),
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'employee_id'            => ['nullable', 'exists:employees,id'],
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_demande'           => ['required', 'date'],
            'urgence'                => ['required', 'string', 'in:normal,important,urgent'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request) {
            $date  = date('Ym', strtotime($request->input('date_demande')));
            $count = DemandeAchat::whereYear('date_demande', date('Y', strtotime($request->input('date_demande'))))
                ->whereMonth('date_demande', date('m', strtotime($request->input('date_demande'))))->count();
            $ref = 'DA-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $demande = DemandeAchat::create([
                'ref'                    => $ref,
                'employee_id'            => $request->input('employee_id'),
                'tier_id'                => $request->input('tier_id'),
                'date_demande'           => $request->input('date_demande'),
                'urgence'                => $request->input('urgence'),
                'devise_id'              => $request->input('devise_id'),
                'branche_id'             => $request->input('branche_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'status'                 => 'brouillon',
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
            ]);

            foreach ($linesData as $lData) {
                $demande->lines()->create($lData);
            }
        });

        return redirect()->route('demandes-achat.index')->with('success', 'Demande d\'achat créée avec succès.');
    }

    public function edit(DemandeAchat $demandesAchat): Response
    {
        $demandesAchat->load(['lines.product', 'lines.purchaseUnit']);

        return Inertia::render('DemandeAchat/Edit', [
            'demande'             => $demandesAchat,
            'employees'           => Employee::orderBy('last_name')->orderBy('first_name')->get(),
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function update(Request $request, DemandeAchat $demandesAchat): RedirectResponse
    {
        $request->validate([
            'employee_id'            => ['nullable', 'exists:employees,id'],
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_demande'           => ['required', 'date'],
            'urgence'                => ['required', 'string', 'in:normal,important,urgent'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $demandesAchat) {
            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $demandesAchat->update([
                'employee_id'            => $request->input('employee_id'),
                'tier_id'                => $request->input('tier_id'),
                'date_demande'           => $request->input('date_demande'),
                'urgence'                => $request->input('urgence'),
                'devise_id'              => $request->input('devise_id'),
                'branche_id'             => $request->input('branche_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
            ]);

            $demandesAchat->lines()->delete();
            foreach ($linesData as $lData) {
                $demandesAchat->lines()->create($lData);
            }
        });

        return redirect()->route('demandes-achat.index')->with('success', 'Demande d\'achat mise à jour avec succès.');
    }

    public function destroy(DemandeAchat $demandesAchat): RedirectResponse
    {
        $demandesAchat->delete();
        return redirect()->route('demandes-achat.index')->with('success', 'Demande d\'achat supprimée avec succès.');
    }

    public function updateStatus(Request $request, DemandeAchat $demandesAchat): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,validee,rejetee,commandee'],
        ]);

        $demandesAchat->update(['status' => $request->input('status')]);
        return back()->with('success', 'Statut de la demande d\'achat mis à jour.');
    }

    private function calcLines(array $lines): array
    {
        $totalHt = 0;
        $totalTtc = 0;
        $linesData = [];

        // Pre-load all needed TauxTva records
        $tauxTvaIds = array_unique(array_filter(array_column($lines, 'taux_tva_id')));
        $tauxTvas = TauxTva::whereIn('id', $tauxTvaIds)->get()->keyBy('id');

        foreach ($lines as $line) {
            $qty    = (double)$line['qty'];
            $puHt   = (double)$line['pu_ht'];
            $tauxTvaId = $line['taux_tva_id'] ?? null;
            $taux = $tauxTvas[$tauxTvaId]->taux ?? 0;
            $tva    = (double)$taux;
            $remise = (double)($line['remise'] ?? 0);
            $rm     = (double)($line['rm'] ?? 0);

            $lineHt      = $qty * $puHt;
            $discount    = ($lineHt * $remise / 100) + $rm;
            $lineTotalHt = max(0, $lineHt - $discount);
            $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

            $totalHt  += $lineTotalHt;
            $totalTtc += $lineTotalTtc;

            $linesData[] = [
                'product_id'       => $line['product_id'],
                'purchase_unit_id' => $line['purchase_unit_id'] ?? null,
                'taux_tva_id'  => $tauxTvaId,
                'tva'          => $tva,
                'qty'              => $qty,
                'pu_ht'            => $puHt,
                'pu_ttc'           => $line['pu_ttc'],
                'remise'           => $remise,
                'rm'               => $rm,
                'total_ht'         => $lineTotalHt,
                'total_ttc'        => $lineTotalTtc,
            ];
        }

        return [$totalHt, $totalTtc, $linesData];
    }
}
