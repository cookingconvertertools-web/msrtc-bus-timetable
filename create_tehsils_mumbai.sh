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
# MUMBAI CITY DISTRICT
####################
create_tehsil "mumbai_city_teh" "Mumbai City Tehsil" "mumbai_city_dist"

####################
# MUMBAI SUBURBAN DISTRICT
####################
create_tehsil "andheri_teh" "Andheri Tehsil" "mumbai_suburban_dist"
create_tehsil "borivali_teh" "Borivali Tehsil" "mumbai_suburban_dist"
create_tehsil "kurla_teh" "Kurla Tehsil" "mumbai_suburban_dist"

####################
# THANE DISTRICT
####################
create_tehsil "thane_teh" "Thane Tehsil" "thane_dist"
create_tehsil "kalyan_teh" "Kalyan Tehsil" "thane_dist"
create_tehsil "bhiwandi_teh" "Bhiwandi Tehsil" "thane_dist"
create_tehsil "ulhasnagar_teh" "Ulhasnagar Tehsil" "thane_dist"
create_tehsil "murbad_teh" "Murbad Tehsil" "thane_dist"
create_tehsil "shahapur_teh" "Shahapur Tehsil" "thane_dist"
create_tehsil "ambernath_teh" "Ambernath Tehsil" "thane_dist"

####################
# PALGHAR DISTRICT
####################
create_tehsil "palghar_teh" "Palghar Tehsil" "palghar_dist"
create_tehsil "vasai_teh" "Vasai Tehsil" "palghar_dist"
create_tehsil "dahanu_teh" "Dahanu Tehsil" "palghar_dist"
create_tehsil "talasari_teh" "Talasari Tehsil" "palghar_dist"
create_tehsil "jawhar_teh" "Jawhar Tehsil" "palghar_dist"
create_tehsil "mokhada_teh" "Mokhada Tehsil" "palghar_dist"
create_tehsil "vikramgad_teh" "Vikramgad Tehsil" "palghar_dist"
create_tehsil "wadi_teh" "Wada Tehsil" "palghar_dist"

####################
# RAIGAD DISTRICT
####################
create_tehsil "alibag_teh" "Alibag Tehsil" "raigad_dist"
create_tehsil "murud_teh" "Murud Tehsil" "raigad_dist"
create_tehsil "panvel_teh" "Panvel Tehsil" "raigad_dist"
create_tehsil "uran_teh" "Uran Tehsil" "raigad_dist"
create_tehsil "pen_teh" "Pen Tehsil" "raigad_dist"
create_tehsil "karjat_raigad_teh" "Karjat Tehsil" "raigad_dist"
create_tehsil "khalapur_teh" "Khalapur Tehsil" "raigad_dist"
create_tehsil "mahad_teh" "Mahad Tehsil" "raigad_dist"
create_tehsil "mangaon_teh" "Mangaon Tehsil" "raigad_dist"
create_tehsil "shrivardhan_teh" "Shrivardhan Tehsil" "raigad_dist"
create_tehsil "sudharagad_teh" "Sudhagad Tehsil" "raigad_dist"
create_tehsil "tala_teh" "Tala Tehsil" "raigad_dist"

####################
# RATNAGIRI DISTRICT
####################
create_tehsil "ratnagiri_teh" "Ratnagiri Tehsil" "ratnagiri_dist"
create_tehsil "chiplun_teh" "Chiplun Tehsil" "ratnagiri_dist"
create_tehsil "dapoli_teh" "Dapoli Tehsil" "ratnagiri_dist"
create_tehsil "guhagar_teh" "Guhagar Tehsil" "ratnagiri_dist"
create_tehsil "khed_ratnagiri_teh" "Khed Tehsil" "ratnagiri_dist"
create_tehsil "mandangad_teh" "Mandangad Tehsil" "ratnagiri_dist"
create_tehsil "rajapur_teh" "Rajapur Tehsil" "ratnagiri_dist"
create_tehsil "sangameshwar_teh" "Sangameshwar Tehsil" "ratnagiri_dist"
create_tehsil "lanja_teh" "Lanja Tehsil" "ratnagiri_dist"

####################
# SINDHUDURG DISTRICT
####################
create_tehsil "kudal_teh" "Kudal Tehsil" "sindhudurg_dist"
create_tehsil "sawantwadi_teh" "Sawantwadi Tehsil" "sindhudurg_dist"
create_tehsil "vengurla_teh" "Vengurla Tehsil" "sindhudurg_dist"
create_tehsil "malvan_teh" "Malvan Tehsil" "sindhudurg_dist"
create_tehsil "devgad_teh" "Devgad Tehsil" "sindhudurg_dist"
create_tehsil "vaibhavwadi_teh" "Vaibhavwadi Tehsil" "sindhudurg_dist"
create_tehsil "kankavli_teh" "Kankavli Tehsil" "sindhudurg_dist"
create_tehsil "dodamarg_teh" "Dodamarg Tehsil" "sindhudurg_dist"

echo "✅ Mumbai division tehsil JSONs created successfully"