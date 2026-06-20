#!/bin/bash
# Script to update all line-controllers: change 'lines.*.tva' => taux_tva_id validation
# and add TauxTva import + pass tauxTvas to create()/edit()

CONTROLLERS=(
  "app/Http/Controllers/AvoirAchatController.php"
  "app/Http/Controllers/AvoirVenteController.php"
  "app/Http/Controllers/CommandeAchatController.php"
  "app/Http/Controllers/CommandeController.php"
  "app/Http/Controllers/ContratAchatController.php"
  "app/Http/Controllers/ContratVenteController.php"
  "app/Http/Controllers/DemandeAchatController.php"
  "app/Http/Controllers/DemandePrixController.php"
  "app/Http/Controllers/DevisController.php"
  "app/Http/Controllers/FactureAchatController.php"
  "app/Http/Controllers/LivraisonController.php"
  "app/Http/Controllers/ReceptionController.php"
  "app/Http/Controllers/RetourAchatController.php"
  "app/Http/Controllers/RetourVenteController.php"
)

for ctrl in "${CONTROLLERS[@]}"; do
  echo "Processing $ctrl..."

  # 1. Add TauxTva import if not already present
  if ! grep -q "use App\\\\Models\\\\TauxTva;" "$ctrl"; then
    # Insert after last 'use App\Models\' line
    sed -i "/^use App\\\\Models\\\\/a use App\\\\Models\\\\TauxTva;" "$ctrl"
    # Remove duplicate if already added
  fi

  # 2. Change validation: 'lines.*.tva' => taux_tva_id
  sed -i "s/'lines\.\*\.tva' => \['required', 'numeric', 'min:0'\]/'lines.*.taux_tva_id' => ['required', 'exists:taux_tvas,id']/g" "$ctrl"

done

echo "Done!"
