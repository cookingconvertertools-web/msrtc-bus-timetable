#!/bin/bash

BASE_DIR="data/tehsils"
mkdir -p "$BASE_DIR"

create_tehsil () {
local alphabet=$(echo "$2" | cut -c1 | tr '[:lower:]' '[:upper:]')
cat <<EOF > "$BASE_DIR/$1.json"
{
  "id": "$1",
  "name": "$2",
  "alphabet": "$alphabet",
  "type": "tehsil",
  "district_id": "$3",
  "depots": ["$1_depot"]
}
EOF
}

####################
# NASHIK DISTRICT
####################
create_tehsil "nashik_teh" "Nashik Tehsil" "nashik_dist"
create_tehsil "sinnar_teh" "Sinnar Tehsil" "nashik_dist"
create_tehsil "igatpuri_teh" "Igatpuri Tehsil" "nashik_dist"
create_tehsil "dindori_teh" "Dindori Tehsil" "nashik_dist"
create_tehsil "peint_teh" "Peint Tehsil" "nashik_dist"
create_tehsil "trimbakeshwar_teh" "Trimbakeshwar Tehsil" "nashik_dist"
create_tehsil "yeola_teh" "Yeola Tehsil" "nashik_dist"
create_tehsil "nandgaon_tehsil" "Nandgaon Tehsil" "nashik_dist"
create_tehsil "chandwad_teh" "Chandwad Tehsil" "nashik_dist"
create_tehsil "kalwan_teh" "Kalwan Tehsil" "nashik_dist"
create_tehsil "deola_teh" "Deola Tehsil" "nashik_dist"
create_tehsil "malegaon_teh" "Malegaon Tehsil" "nashik_dist"
create_tehsil "baglan_teh" "Baglan (Satana) Tehsil" "nashik_dist"

####################
# DHULE DISTRICT
####################
create_tehsil "dhule_teh" "Dhule Tehsil" "dhule_dist"
create_tehsil "sakri_teh" "Sakri Tehsil" "dhule_dist"
create_tehsil "shirpur_teh" "Shirpur Tehsil" "dhule_dist"
create_tehsil "sindkheda_teh" "Sindkheda Tehsil" "dhule_dist"

####################
# JALGAON DISTRICT
####################
create_tehsil "jalgaon_teh" "Jalgaon Tehsil" "jalgaon_dist"
create_tehsil "bhusawal_teh" "Bhusawal Tehsil" "jalgaon_dist"
create_tehsil "chalisgaon_teh" "Chalisgaon Tehsil" "jalgaon_dist"
create_tehsil "jamner_teh" "Jamner Tehsil" "jalgaon_dist"
create_tehsil "erandol_teh" "Erandol Tehsil" "jalgaon_dist"
create_tehsil "yawal_teh" "Yawal Tehsil" "jalgaon_dist"
create_tehsil "raver_teh" "Raver Tehsil" "jalgaon_dist"
create_tehsil "pachora_teh" "Pachora Tehsil" "jalgaon_dist"
create_tehsil "parola_teh" "Parola Tehsil" "jalgaon_dist"
create_tehsil "amalner_teh" "Amalner Tehsil" "jalgaon_dist"
create_tehsil "chopda_teh" "Chopda Tehsil" "jalgaon_dist"
create_tehsil "bodwad_teh" "Bodwad Tehsil" "jalgaon_dist"
create_tehsil "muktainagar_teh" "Muktainagar Tehsil" "jalgaon_dist"

####################
# AHILYANAGAR DISTRICT (AHMEDNAGAR)
####################
create_tehsil "ahilyanagar_teh" "Ahilyanagar Tehsil" "ahilyanagar_dist"
create_tehsil "shevgaon_teh" "Shevgaon Tehsil" "ahilyanagar_dist"
create_tehsil "pathardi_teh" "Pathardi Tehsil" "ahilyanagar_dist"
create_tehsil "parner_teh" "Parner Tehsil" "ahilyanagar_dist"
create_tehsil "shrigonda_teh" "Shrigonda Tehsil" "ahilyanagar_dist"
create_tehsil "karjat_ahilyanagar_teh" "Karjat Tehsil" "ahilyanagar_dist"
create_tehsil "jamkhed_teh" "Jamkhed Tehsil" "ahilyanagar_dist"
create_tehsil "shrirampur_teh" "Shrirampur Tehsil" "ahilyanagar_dist"
create_tehsil "rahata_teh" "Rahata Tehsil" "ahilyanagar_dist"
create_tehsil "kopargaon_teh" "Kopargaon Tehsil" "ahilyanagar_dist"
create_tehsil "akole_teh" "Akole Tehsil" "ahilyanagar_dist"
create_tehsil "sangamner_teh" "Sangamner Tehsil" "ahilyanagar_dist"
create_tehsil "nevasa_teh" "Nevasa Tehsil" "ahilyanagar_dist"
create_tehsil "rahuri_teh" "Rahuri Tehsil" "ahilyanagar_dist"

echo "✅ Nashik division tehsil JSONs created successfully"