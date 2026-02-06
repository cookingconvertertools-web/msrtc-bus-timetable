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
# PUNE DISTRICT
####################
create_tehsil "pune_city_teh" "Pune City Tehsil" "pune_dist"
create_tehsil "haveli_teh" "Haveli Tehsil" "pune_dist"
create_tehsil "mulshi_teh" "Mulshi Tehsil" "pune_dist"
create_tehsil "maval_teh" "Maval Tehsil" "pune_dist"
create_tehsil "junnar_teh" "Junnar Tehsil" "pune_dist"
create_tehsil "ambegaon_teh" "Ambegaon Tehsil" "pune_dist"
create_tehsil "khed_teh" "Khed Tehsil" "pune_dist"
create_tehsil "shirur_teh" "Shirur Tehsil" "pune_dist"
create_tehsil "purandar_teh" "Purandar Tehsil" "pune_dist"
create_tehsil "bhor_teh" "Bhor Tehsil" "pune_dist"
create_tehsil "velhe_teh" "Velhe Tehsil" "pune_dist"
create_tehsil "baramati_teh" "Baramati Tehsil" "pune_dist"
create_tehsil "indapur_teh" "Indapur Tehsil" "pune_dist"
create_tehsil "daund_teh" "Daund Tehsil" "pune_dist"

####################
# SATARA DISTRICT
####################
create_tehsil "satara_teh" "Satara Tehsil" "satara_dist"
create_tehsil "karad_teh" "Karad Tehsil" "satara_dist"
create_tehsil "wai_teh" "Wai Tehsil" "satara_dist"
create_tehsil "mahabaleshwar_teh" "Mahabaleshwar Tehsil" "satara_dist"
create_tehsil "patan_teh" "Patan Tehsil" "satara_dist"
create_tehsil "phaltan_teh" "Phaltan Tehsil" "satara_dist"
create_tehsil "khandala_satara_teh" "Khandala Tehsil" "satara_dist"
create_tehsil "koregaon_teh" "Koregaon Tehsil" "satara_dist"
create_tehsil "man_teh" "Man Tehsil" "satara_dist"
create_tehsil "khatav_teh" "Khatav Tehsil" "satara_dist"
create_tehsil "jaoli_teh" "Jaoli Tehsil" "satara_dist"

####################
# SANGLI DISTRICT
####################
create_tehsil "sangli_teh" "Sangli Tehsil" "sangli_dist"
create_tehsil "miraj_teh" "Miraj Tehsil" "sangli_dist"
create_tehsil "tasgaon_teh" "Tasgaon Tehsil" "sangli_dist"
create_tehsil "kavathe_mahankal_teh" "Kavathe Mahankal Tehsil" "sangli_dist"
create_tehsil "jat_teh" "Jat Tehsil" "sangli_dist"
create_tehsil "atpadi_teh" "Atpadi Tehsil" "sangli_dist"
create_tehsil "khanapur_sangli_teh" "Khanapur Tehsil" "sangli_dist"
create_tehsil "palus_teh" "Palus Tehsil" "sangli_dist"
create_tehsil "shirala_teh" "Shirala Tehsil" "sangli_dist"
create_tehsil "walwa_teh" "Walwa Tehsil" "sangli_dist"

####################
# SOLAPUR DISTRICT
####################
create_tehsil "solapur_north_teh" "Solapur North Tehsil" "solapur_dist"
create_tehsil "solapur_south_teh" "Solapur South Tehsil" "solapur_dist"
create_tehsil "akkalkot_teh" "Akkalkot Tehsil" "solapur_dist"
create_tehsil "barshi_teh" "Barshi Tehsil" "solapur_dist"
create_tehsil "mohol_teh" "Mohol Tehsil" "solapur_dist"
create_tehsil "madha_teh" "Madha Tehsil" "solapur_dist"
create_tehsil "karmala_teh" "Karmala Tehsil" "solapur_dist"
create_tehsil "pandharpur_teh" "Pandharpur Tehsil" "solapur_dist"
create_tehsil "mangalvedhe_teh" "Mangalvedhe Tehsil" "solapur_dist"
create_tehsil "malshiras_teh" "Malshiras Tehsil" "solapur_dist"
create_tehsil "sangola_teh" "Sangola Tehsil" "solapur_dist"

####################
# KOLHAPUR DISTRICT
####################
create_tehsil "kolhapur_teh" "Kolhapur Tehsil" "kolhapur_dist"
create_tehsil "panhala_teh" "Panhala Tehsil" "kolhapur_dist"
create_tehsil "shahuwadi_teh" "Shahuwadi Tehsil" "kolhapur_dist"
create_tehsil "hatkanangle_teh" "Hatkanangle Tehsil" "kolhapur_dist"
create_tehsil "shirol_teh" "Shirol Tehsil" "kolhapur_dist"
create_tehsil "kagal_teh" "Kagal Tehsil" "kolhapur_dist"
create_tehsil "karvir_teh" "Karvir Tehsil" "kolhapur_dist"
create_tehsil "gaganbawada_teh" "Gaganbawada Tehsil" "kolhapur_dist"
create_tehsil "radhanagari_teh" "Radhanagari Tehsil" "kolhapur_dist"
create_tehsil "bhudargad_teh" "Bhudargad Tehsil" "kolhapur_dist"
create_tehsil "ajra_teh" "Ajra Tehsil" "kolhapur_dist"
create_tehsil "chandgad_teh" "Chandgad Tehsil" "kolhapur_dist"

echo "✅ Pune division tehsil JSONs created successfully"