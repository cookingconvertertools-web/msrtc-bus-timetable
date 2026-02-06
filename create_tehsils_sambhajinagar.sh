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

################################
# CHHATRAPATI SAMBHAJINAGAR DISTRICT
################################
create_tehsil "chhatrapati_sambhajinagar_teh" "Chhatrapati Sambhajinagar Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "gangapur_teh" "Gangapur Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "vaijapur_teh" "Vaijapur Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "sillod_teh" "Sillod Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "soegaon_teh" "Soegaon Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "phulambri_teh" "Phulambri Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "khultabad_teh" "Khultabad Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "kannad_teh" "Kannad Tehsil" "chhatrapati_sambhajinagar_dist"
create_tehsil "paithan_teh" "Paithan Tehsil" "chhatrapati_sambhajinagar_dist"

####################
# JALNA DISTRICT
####################
create_tehsil "jalna_teh" "Jalna Tehsil" "jalna_dist"
create_tehsil "ambad_teh" "Ambad Tehsil" "jalna_dist"
create_tehsil "badnapur_teh" "Badnapur Tehsil" "jalna_dist"
create_tehsil "ghansawangi_teh" "Ghansawangi Tehsil" "jalna_dist"
create_tehsil "partur_teh" "Partur Tehsil" "jalna_dist"
create_tehsil "mantha_teh" "Mantha Tehsil" "jalna_dist"

####################
# BEED DISTRICT
####################
create_tehsil "beed_teh" "Beed Tehsil" "beed_dist"
create_tehsil "ashti_teh" "Ashti Tehsil" "beed_dist"
create_tehsil "georai_teh" "Georai Tehsil" "beed_dist"
create_tehsil "majalgaon_teh" "Majalgaon Tehsil" "beed_dist"
create_tehsil "patoda_teh" "Patoda Tehsil" "beed_dist"
create_tehsil "shirur_kasar_teh" "Shirur Kasar Tehsil" "beed_dist"
create_tehsil "wadwani_teh" "Wadwani Tehsil" "beed_dist"
create_tehsil "kaij_teh" "Kaij Tehsil" "beed_dist"
create_tehsil "dharur_teh" "Dharur Tehsil" "beed_dist"
create_tehsil "parli_teh" "Parli Tehsil" "beed_dist"
create_tehsil "ambajogai_teh" "Ambajogai Tehsil" "beed_dist"

####################
# LATUR DISTRICT
####################
create_tehsil "latur_teh" "Latur Tehsil" "latur_dist"
create_tehsil "ausa_teh" "Ausa Tehsil" "latur_dist"
create_tehsil "chakur_teh" "Chakur Tehsil" "latur_dist"
create_tehsil "deoni_teh" "Deoni Tehsil" "latur_dist"
create_tehsil "jalkot_teh" "Jalkot Tehsil" "latur_dist"
create_tehsil "nilanga_teh" "Nilanga Tehsil" "latur_dist"
create_tehsil "renapur_teh" "Renapur Tehsil" "latur_dist"
create_tehsil "shirur_anantpal_teh" "Shirur Anantpal Tehsil" "latur_dist"
create_tehsil "udgir_teh" "Udgir Tehsil" "latur_dist"

####################
# NANDED DISTRICT
####################
create_tehsil "nanded_teh" "Nanded Tehsil" "nanded_dist"
create_tehsil "ardhapur_teh" "Ardhapur Tehsil" "nanded_dist"
create_tehsil "biloli_teh" "Biloli Tehsil" "nanded_dist"
create_tehsil "degloor_teh" "Degloor Tehsil" "nanded_dist"
create_tehsil "dharmabad_teh" "Dharmabad Tehsil" "nanded_dist"
create_tehsil "hadgaon_teh" "Hadgaon Tehsil" "nanded_dist"
create_tehsil "himayatnagar_teh" "Himayatnagar Tehsil" "nanded_dist"
create_tehsil "kandhar_teh" "Kandhar Tehsil" "nanded_dist"
create_tehsil "kinwat_teh" "Kinwat Tehsil" "nanded_dist"
create_tehsil "mudkhed_teh" "Mudkhed Tehsil" "nanded_dist"
create_tehsil "naigaon_teh" "Naigaon Tehsil" "nanded_dist"
create_tehsil "umri_teh" "Umri Tehsil" "nanded_dist"

####################
# DHARASHIV DISTRICT
####################
create_tehsil "dharashiv_teh" "Dharashiv Tehsil" "dharashiv_dist"
create_tehsil "bhoom_teh" "Bhoom Tehsil" "dharashiv_dist"
create_tehsil "kalamb_teh" "Kalamb Tehsil" "dharashiv_dist"
create_tehsil "lohara_teh" "Lohara Tehsil" "dharashiv_dist"
create_tehsil "omerga_teh" "Omerga Tehsil" "dharashiv_dist"
create_tehsil "paranda_teh" "Paranda Tehsil" "dharashiv_dist"
create_tehsil "tuljapur_teh" "Tuljapur Tehsil" "dharashiv_dist"
create_tehsil "washi_teh" "Washi Tehsil" "dharashiv_dist"

####################
# PARBHANI DISTRICT
####################
create_tehsil "parbhani_teh" "Parbhani Tehsil" "parbhani_dist"
create_tehsil "gangakhed_teh" "Gangakhed Tehsil" "parbhani_dist"
create_tehsil "jintur_teh" "Jintur Tehsil" "parbhani_dist"
create_tehsil "manwath_teh" "Manwath Tehsil" "parbhani_dist"
create_tehsil "pathri_teh" "Pathri Tehsil" "parbhani_dist"
create_tehsil "palam_teh" "Palam Tehsil" "parbhani_dist"
create_tehsil "purna_teh" "Purna Tehsil" "parbhani_dist"
create_tehsil "sonpeth_teh" "Sonpeth Tehsil" "parbhani_dist"
create_tehsil "selu_teh" "Selu Tehsil" "parbhani_dist"

####################
# HINGOLI DISTRICT
####################
create_tehsil "hingoli_teh" "Hingoli Tehsil" "hingoli_dist"
create_tehsil "basmath_teh" "Basmath Tehsil" "hingoli_dist"
create_tehsil "kalamnuri_teh" "Kalamnuri Tehsil" "hingoli_dist"
create_tehsil "sengaon_teh" "Sengaon Tehsil" "hingoli_dist"

echo "✅ Chhatrapati Sambhajinagar division tehsil JSONs created successfully"