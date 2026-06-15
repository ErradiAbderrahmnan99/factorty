<?php

namespace App\Http\Controllers;

use App\Models\PeriodeComptable;
use App\Models\ExerciceComptable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class PeriodeComptableController extends Controller
{
    public function index(Request $request)
    {
        $query = PeriodeComptable::with('exercice');

        if ($request->has('search') && $request->search != '') {
            $query->where('code', 'like', '%' . $request->search . '%')
                  ->orWhere('libelle', 'like', '%' . $request->search . '%')
                  ->orWhereHas('exercice', function($q) use ($request) {
                      $q->where('code', 'like', '%' . $request->search . '%');
                  });
        }

        $periodes = $query->orderBy('date_debut', 'desc')->paginate(10)->withQueryString();
        $exercices = ExerciceComptable::orderBy('code', 'desc')->get();

        return Inertia::render('PeriodesComptables/Index', [
            'periodes' => $periodes,
            'filters' => $request->only(['search']),
            'exercices' => $exercices,
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'exercice_comptable_id' => 'required|exists:exercice_comptables,id',
        ]);

        $exercice = ExerciceComptable::findOrFail($request->exercice_comptable_id);

        $start = Carbon::parse($exercice->date_debut);
        $end = Carbon::parse($exercice->date_fin);
        
        $current = $start->copy()->startOfMonth();
        
        while ($current <= $end) {
            $monthEnd = $current->copy()->endOfMonth();
            if ($monthEnd > $end) {
                $monthEnd = $end->copy();
            }
            
            $periodStart = $current->copy();
            if ($periodStart < $start) {
                $periodStart = $start->copy();
            }

            $code = $exercice->code . '-' . $periodStart->format('m');
            
            $exists = PeriodeComptable::where('exercice_comptable_id', $exercice->id)->where('code', $code)->exists();
            if (!$exists) {
                $monthName = $periodStart->locale('fr')->translatedFormat('F');
                $libelle = ucfirst($monthName) . ' ' . $periodStart->format('Y');

                PeriodeComptable::create([
                    'exercice_comptable_id' => $exercice->id,
                    'code' => $code,
                    'libelle' => $libelle,
                    'date_debut' => $periodStart->toDateString(),
                    'date_fin' => $monthEnd->toDateString(),
                    'statut' => 'ouvert',
                ]);
            }

            $current->addMonth()->startOfMonth();
        }

        return Redirect::route('periodes-comptables.index')->with('success', 'Périodes générées avec succès.');
    }

    public function create()
    {
        return Inertia::render('PeriodesComptables/Create', [
            'exercices' => ExerciceComptable::orderBy('code', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'exercice_comptable_id' => 'required|exists:exercice_comptables,id',
            'code' => [
                'required',
                'string',
                Rule::unique('periode_comptables')->where(function ($query) use ($request) {
                    return $query->where('exercice_comptable_id', $request->exercice_comptable_id);
                })
            ],
            'libelle' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'statut' => 'required|in:ouvert,cloture',
        ]);

        PeriodeComptable::create($request->all());

        return Redirect::route('periodes-comptables.index')->with('success', 'Période comptable créée avec succès.');
    }

    public function edit(PeriodeComptable $periodes_comptable)
    {
        return Inertia::render('PeriodesComptables/Edit', [
            'periode' => $periodes_comptable,
            'exercices' => ExerciceComptable::orderBy('code', 'desc')->get(),
        ]);
    }

    public function update(Request $request, PeriodeComptable $periodes_comptable)
    {
        $request->validate([
            'exercice_comptable_id' => 'required|exists:exercice_comptables,id',
            'code' => [
                'required',
                'string',
                Rule::unique('periode_comptables')->where(function ($query) use ($request) {
                    return $query->where('exercice_comptable_id', $request->exercice_comptable_id);
                })->ignore($periodes_comptable->id)
            ],
            'libelle' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'statut' => 'required|in:ouvert,cloture',
        ]);

        $periodes_comptable->update($request->all());

        return Redirect::route('periodes-comptables.index')->with('success', 'Période comptable mise à jour avec succès.');
    }

    public function destroy(PeriodeComptable $periodes_comptable)
    {
        $periodes_comptable->delete();

        return Redirect::route('periodes-comptables.index')->with('success', 'Période comptable supprimée avec succès.');
    }
}
