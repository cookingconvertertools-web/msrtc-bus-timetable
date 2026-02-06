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

############################
# AMRAVATI DISTRICT
############################
create_tehsil "amravati_teh" "Amravati Tehsil" "amravati_dist"
create_tehsil "bhatkuli_teh" "Bhatkuli Tehsil" "amravati_dist"
create_tehsil "nandgaon_khandeshwar_teh" "Nandgaon Khandeshwar Tehsil" "amravati_dist"
create_tehsil "daryapur_teh" "Daryapur Tehsil" "amravati_dist"
create_tehsil "anjangaon_surji_teh" "Anjangaon Surji Tehsil" "amravati_dist"
create_tehsil "chandur_railway_teh" "Chandur Railway Tehsil" "amravati_dist"
create_tehsil "chandur_bazar_teh" "Chandur Bazar Tehsil" "amravati_dist"
create_tehsil "dhamangaon_railway_teh" "Dhamangaon Railway Tehsil" "amravati_dist"
create_tehsil "morshi_teh" "Morshi Tehsil" "amravati_dist"
create_tehsil "warud_teh" "Warud Tehsil" "amravati_dist"

############################
# AKOLA DISTRICT
############################
create_tehsil "akola_teh" "Akola Tehsil" "akola_dist"
create_tehsil "akot_teh" "Akot Tehsil" "akola_dist"
create_tehsil "telhara_teh" "Telhara Tehsil" "akola_dist"
create_tehsil "balapur_teh" "Balapur Tehsil" "akola_dist"
create_tehsil "patur_teh" "Patur Tehsil" "akola_dist"
create_tehsil "murtijapur_teh" "Murtijapur Tehsil" "akola_dist"
create_tehsil "barshitakli_teh" "Barshitakli Tehsil" "akola_dist"

############################
# NAGPUR DISTRICT
############################
create_tehsil "nagpur_teh" "Nagpur Tehsil" "nagpur_dist"
create_tehsil "kamptee_teh" "Kamptee Tehsil" "nagpur_dist"
create_tehsil "hingna_teh" "Hingna Tehsil" "nagpur_dist"
create_tehsil "katol_teh" "Katol Tehsil" "nagpur_dist"
create_tehsil "kalameshwar_teh" "Kalameshwar Tehsil" "nagpur_dist"
create_tehsil "narkhed_teh" "Narkhed Tehsil" "nagpur_dist"
create_tehsil "ramtek_teh" "Ramtek Tehsil" "nagpur_dist"
create_tehsil "savner_teh" "Savner Tehsil" "nagpur_dist"
create_tehsil "umred_teh" "Umred Tehsil" "nagpur_dist"
create_tehsil "parseoni_teh" "Parseoni Tehsil" "nagpur_dist"
create_tehsil "mauda_teh" "Mauda Tehsil" "nagpur_dist"

############################
# PUNE DISTRICT
############################
create_tehsil "pune_teh" "Pune Tehsil" "pune_dist"
create_tehsil "haveli_teh" "Haveli Tehsil" "pune_dist"
create_tehsil "mulshi_teh" "Mulshi Tehsil" "pune_dist"
create_tehsil "bhor_teh" "Bhor Tehsil" "pune_dist"
create_tehsil "velhe_teh" "Velhe Tehsil" "pune_dist"
create_tehsil "junnar_teh" "Junnar Tehsil" "pune_dist"
create_tehsil "ambegaon_teh" "Ambegaon Tehsil" "pune_dist"
create_tehsil "khed_teh" "Khed Tehsil" "pune_dist"
create_tehsil "shirur_teh" "Shirur Tehsil" "pune_dist"
create_tehsil "baramati_teh" "Baramati Tehsil" "pune_dist"
create_tehsil "indapur_teh" "Indapur Tehsil" "pune_dist"
create_tehsil "daund_teh" "Daund Tehsil" "pune_dist"
create_tehsil "purandar_teh" "Purandar Tehsil" "pune_dist"
create_tehsil "maval_teh" "Maval Tehsil" "pune_dist"

############################
# MUMBAI CITY & SUBURBAN
############################
create_tehsil "mumbai_city_teh" "Mumbai City Tehsil" "mumbai_city_dist"
create_tehsil "andheri_teh" "Andheri Tehsil" "mumbai_suburban_dist"
create_tehsil "borivali_teh" "Borivali Tehsil" "mumbai_suburban_dist"
create_tehsil "kurla_teh" "Kurla Tehsil" "mumbai_suburban_dist"

echo "✅ Tehsil JSON files created in data/tehsils"