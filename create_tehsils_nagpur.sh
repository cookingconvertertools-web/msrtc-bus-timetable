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
# NAGPUR DISTRICT
####################
create_tehsil "nagpur_city_teh" "Nagpur City Tehsil" "nagpur_dist"
create_tehsil "nagpur_rural_teh" "Nagpur Rural Tehsil" "nagpur_dist"
create_tehsil "kamptee_teh" "Kamptee Tehsil" "nagpur_dist"
create_tehsil "hingna_teh" "Hingna Tehsil" "nagpur_dist"
create_tehsil "kalameshwar_teh" "Kalameshwar Tehsil" "nagpur_dist"
create_tehsil "katol_teh" "Katol Tehsil" "nagpur_dist"
create_tehsil "narkhed_teh" "Narkhed Tehsil" "nagpur_dist"
create_tehsil "savner_teh" "Savner Tehsil" "nagpur_dist"
create_tehsil "umred_teh" "Umred Tehsil" "nagpur_dist"
create_tehsil "parseoni_teh" "Parseoni Tehsil" "nagpur_dist"
create_tehsil "ramtek_teh" "Ramtek Tehsil" "nagpur_dist"
create_tehsil "mauda_teh" "Mauda Tehsil" "nagpur_dist"

####################
# WARDHA DISTRICT
####################
create_tehsil "wardha_teh" "Wardha Tehsil" "wardha_dist"
create_tehsil "arvi_teh" "Arvi Tehsil" "wardha_dist"
create_tehsil "ashti_wardha_teh" "Ashti Tehsil" "wardha_dist"
create_tehsil "deoli_teh" "Deoli Tehsil" "wardha_dist"
create_tehsil "hinganghat_teh" "Hinganghat Tehsil" "wardha_dist"
create_tehsil "seloo_teh" "Seloo Tehsil" "wardha_dist"
create_tehsil "samudrapur_teh" "Samudrapur Tehsil" "wardha_dist"

####################
# BHANDARA DISTRICT
####################
create_tehsil "bhandara_teh" "Bhandara Tehsil" "bhandara_dist"
create_tehsil "mohadi_teh" "Mohadi Tehsil" "bhandara_dist"
create_tehsil "tumsar_teh" "Tumsar Tehsil" "bhandara_dist"
create_tehsil "pauni_teh" "Pauni Tehsil" "bhandara_dist"
create_tehsil "sakoli_teh" "Sakoli Tehsil" "bhandara_dist"
create_tehsil "lakhandur_teh" "Lakhandur Tehsil" "bhandara_dist"
create_tehsil "lakhani_teh" "Lakhani Tehsil" "bhandara_dist"

####################
# CHANDRAPUR DISTRICT
####################
create_tehsil "chandrapur_teh" "Chandrapur Tehsil" "chandrapur_dist"
create_tehsil "ballarpur_teh" "Ballarpur Tehsil" "chandrapur_dist"
create_tehsil "bhadravati_teh" "Bhadravati Tehsil" "chandrapur_dist"
create_tehsil "warora_teh" "Warora Tehsil" "chandrapur_dist"
create_tehsil "chimur_teh" "Chimur Tehsil" "chandrapur_dist"
create_tehsil "nagbhid_teh" "Nagbhid Tehsil" "chandrapur_dist"
create_tehsil "brahmapuri_teh" "Brahmapuri Tehsil" "chandrapur_dist"
create_tehsil "sindewahi_teh" "Sindewahi Tehsil" "chandrapur_dist"
create_tehsil "mul_teh" "Mul Tehsil" "chandrapur_dist"
create_tehsil "saoli_teh" "Saoli Tehsil" "chandrapur_dist"
create_tehsil "pombhurna_teh" "Pombhurna Tehsil" "chandrapur_dist"
create_tehsil "gondpipri_teh" "Gondpipri Tehsil" "chandrapur_dist"
create_tehsil "rajura_teh" "Rajura Tehsil" "chandrapur_dist"
create_tehsil "korpana_teh" "Korpana Tehsil" "chandrapur_dist"
create_tehsil "jirwat_teh" "Jirwat Tehsil" "chandrapur_dist"

####################
# GADCHIROLI DISTRICT
####################
create_tehsil "gadchiroli_teh" "Gadchiroli Tehsil" "gadchiroli_dist"
create_tehsil "armori_teh" "Armori Tehsil" "gadchiroli_dist"
create_tehsil "desaiganj_teh" "Desaiganj Tehsil" "gadchiroli_dist"
create_tehsil "dhanora_teh" "Dhanora Tehsil" "gadchiroli_dist"
create_tehsil "korchi_teh" "Korchi Tehsil" "gadchiroli_dist"
create_tehsil "kurkheda_teh" "Kurkheda Tehsil" "gadchiroli_dist"
create_tehsil "mulchera_teh" "Mulchera Tehsil" "gadchiroli_dist"
create_tehsil "etapalli_teh" "Etapalli Tehsil" "gadchiroli_dist"
create_tehsil "aheri_teh" "Aheri Tehsil" "gadchiroli_dist"
create_tehsil "chamorshi_teh" "Chamorshi Tehsil" "gadchiroli_dist"
create_tehsil "sironcha_teh" "Sironcha Tehsil" "gadchiroli_dist"
create_tehsil "bhamragad_teh" "Bhamragad Tehsil" "gadchiroli_dist"

echo "✅ Nagpur division tehsil JSONs created successfully"