<?php

namespace App\Http\Controllers;

use App\Models\LegalForm;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LegalFormController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('LegalForm/Index', [
            'legalForms' => LegalForm::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code'        => ['required', 'string', 'max:30', 'unique:legal_forms,code'],
            'label'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        LegalForm::create($request->only('code', 'label', 'description'));
        return back()->with('success', 'Forme juridique créée.');
    }

    public function update(Request $request, LegalForm $legalForm): RedirectResponse
    {
        $request->validate([
            'code'        => ['required', 'string', 'max:30', "unique:legal_forms,code,{$legalForm->id}"],
            'label'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $legalForm->update($request->only('code', 'label', 'description'));
        return back()->with('success', 'Forme juridique mise à jour.');
    }

    public function destroy(LegalForm $legalForm): RedirectResponse
    {
        $legalForm->delete();
        return back()->with('success', 'Forme juridique supprimée.');
    }
}
