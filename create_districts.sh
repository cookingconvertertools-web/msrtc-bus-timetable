#!/bin/bash

BASE_DIR="data/districts"
mkdir -p "$BASE_DIR"

create_district () {
local id=$1
local name=$2
local division=$3
local tehsils=$4
local alphabet=$(echo "$2" | cut -c1 | tr '[:lower:]' '[:upper:]')

cat <<EOF > "$BASE_DIR/$id.json"
{
  "id": "$id",
  "name": "$name",
  "alphabet": "$alphabet",
  "type": "district",
  "division_id": "$division",
  "tehsils": [$tehsils]
}
EOF
}

############################
# AMRAVATI DIVISION (5)
############################

create_district "amravati_dist" "Amravati District" "amravati_div" \
"\"amravati_teh\",\"bhatkuli_teh\",\"nandgaon_khandeshwar_teh\",\"daryapur_teh\",\"anjangaon_surji_teh\",\"chandur_railway_teh\",\"chandur_bazar_teh\",\"dhamangaon_railway_teh\",\"morshi_teh\",\"warud_teh\""

create_district "akola_dist" "Akola District" "amravati_div" \
"\"akola_teh\",\"akot_teh\",\"telhara_teh\",\"balapur_teh\",\"patur_teh\",\"murtijapur_teh\",\"barshitakli_teh\""

create_district "buldhana_dist" "Buldhana District" "amravati_div" \
"\"buldhana_teh\",\"chikhli_teh\",\"deulgaon_raja_teh\",\"jalgaon_jamod_teh\",\"khamgaon_teh\",\"lonar_teh\",\"mehkar_teh\",\"nandura_teh\",\"shegaon_teh\",\"sindkhed_raja_teh\",\"motala_teh\",\"sangrampur_teh\",\"malakapur_teh\""

create_district "washim_dist" "Washim District" "amravati_div" \
"\"washim_teh\",\"malegaon_teh\",\"risod_teh\",\"manora_teh\",\"karanja_teh\",\"mangrulpir_teh\""

create_district "yavatmal_dist" "Yavatmal District" "amravati_div" \
"\"yavatmal_teh\",\"arni_teh\",\"babhulgaon_teh\",\"darwha_teh\",\"digras_teh\",\"ghatanji_teh\",\"kalamb_teh\",\"mahagaon_teh\",\"maregaon_teh\",\"ner_teh\",\"pandharkawada_teh\",\"ralegaon_teh\",\"umarkhed_teh\",\"wanni_teh\",\"zari_jamni_teh\""

############################
# CH. SAMBHAJINAGAR DIV (8)
############################

create_district "chhatrapati_sambhajinagar_dist" "Chhatrapati Sambhajinagar District" "chhatrapati_sambhajinagar_div" \
"\"chhatrapati_sambhajinagar_teh\",\"gangapur_teh\",\"vaijapur_teh\",\"sillod_teh\",\"soegaon_teh\",\"phulambri_teh\",\"khultabad_teh\",\"kannad_teh\",\"paithan_teh\""

create_district "jalna_dist" "Jalna District" "chhatrapati_sambhajinagar_div" \
"\"jalna_teh\",\"ambad_teh\",\"badnapur_teh\",\"ghansawangi_teh\",\"partur_teh\",\"mantha_teh\""

create_district "beed_dist" "Beed District" "chhatrapati_sambhajinagar_div" \
"\"beed_teh\",\"ashti_teh\",\"georai_teh\",\"majalgon_teh\",\"patoda_teh\",\"shirur_kasar_teh\",\"wadwani_teh\",\"kaij_teh\",\"dharur_teh\",\"parli_teh\",\"ambajogai_teh\""

create_district "latur_dist" "Latur District" "chhatrapati_sambhajinagar_div" \
"\"latur_teh\",\"ausa_teh\",\"chakur_teh\",\"deoni_teh\",\"jalkot_teh\",\"nilanga_teh\",\"renapur_teh\",\"shirur_anantpal_teh\",\"udgir_teh\""

create_district "nanded_dist" "Nanded District" "chhatrapati_sambhajinagar_div" \
"\"nanded_teh\",\"aradhapur_teh\",\"biloli_teh\",\"degloor_teh\",\"dharmabad_teh\",\"hadgaon_teh\",\"himayatnagar_teh\",\"kandhar_teh\",\"kinwat_teh\",\"mudkhed_teh\",\"naigaon_teh\",\"umri_teh\""

create_district "dharashiv_dist" "Dharashiv District" "chhatrapati_sambhajinagar_div" \
"\"dharashiv_teh\",\"bhoom_teh\",\"kalamb_teh\",\"lohara_teh\",\"omarga_teh\",\"paranda_teh\",\"tuljapur_teh\",\"washi_teh\""

create_district "parbhani_dist" "Parbhani District" "chhatrapati_sambhajinagar_div" \
"\"parbhani_teh\",\"gangakhed_teh\",\"jintur_teh\",\"manwath_teh\",\"pathri_teh\",\"palam_teh\",\"purna_teh\",\"sonpeth_teh\",\"selu_teh\""

create_district "hingoli_dist" "Hingoli District" "chhatrapati_sambhajinagar_div" \
"\"hingoli_teh\",\"basmat_teh\",\"kalamnuri_teh\",\"sengaon_teh\""

############################
# NAGPUR DIVISION (6)
############################

create_district "nagpur_dist" "Nagpur District" "nagpur_div" \
"\"nagpur_teh\",\"kamptee_teh\",\"hingna_teh\",\"katol_teh\",\"kalameshwar_teh\",\"narkhed_teh\",\"ramtek_teh\",\"savner_teh\",\"umred_teh\",\"parseoni_teh\",\"mauda_teh\""

create_district "wardha_dist" "Wardha District" "nagpur_div" \
"\"wardha_teh\",\"arvi_teh\",\"ashti_teh\",\"deoli_teh\",\"hinganghat_teh\",\"samudrapur_teh\""

create_district "chandrapur_dist" "Chandrapur District" "nagpur_div" \
"\"chandrapur_teh\",\"ballarpur_teh\",\"bhadravati_teh\",\"brahmapuri_teh\",\"chimur_teh\",\"gondpipri_teh\",\"mul_teh\",\"nagbhid_teh\",\"rajura_teh\",\"warora_teh\""

create_district "gadchiroli_dist" "Gadchiroli District" "nagpur_div" \
"\"gadchiroli_teh\",\"aheri_teh\",\"armori_teh\",\"bhamragad_teh\",\"chamorshi_teh\",\"desaiganj_teh\",\"dhanora_teh\",\"etapalli_teh\",\"korchi_teh\",\"kurkheda_teh\",\"mulchera_teh\",\"sironcha_teh\""

create_district "bhandara_dist" "Bhandara District" "nagpur_div" \
"\"bhandara_teh\",\"lakhandur_teh\",\"lakhani_teh\",\"mohadi_teh\",\"pauni_teh\",\"sakoli_teh\",\"tumsar_teh\""

create_district "gondia_dist" "Gondia District" "nagpur_div" \
"\"gondia_teh\",\"amgaon_teh\",\"arjuni_morgaon_teh\",\"deori_teh\",\"goregaon_teh\",\"sadak_arjuni_teh\",\"salekasa_teh\",\"tirora_teh\""

############################
# NASHIK DIVISION (5)
############################

create_district "nashik_dist" "Nashik District" "nashik_div" \
"\"nashik_teh\",\"igatpuri_teh\",\"dindori_teh\",\"peint_teh\",\"surgana_teh\",\"kalwan_teh\",\"baglan_teh\",\"yeola_teh\",\"nandgaon_teh\",\"chandwad_teh\",\"malegaon_teh\",\"sinnar_teh\",\"trimbakeshwar_teh\""

create_district "dhule_dist" "Dhule District" "nashik_div" \
"\"dhule_teh\",\"sakri_teh\",\"shirpur_teh\",\"sindkheda_teh\""

create_district "jalgaon_dist" "Jalgaon District" "nashik_div" \
"\"jalgaon_teh\",\"bhusawal_teh\",\"chalisgaon_teh\",\"pachora_teh\",\"jamner_teh\",\"erandol_teh\",\"yawalmale_teh\",\"raver_teh\",\"muktainagar_teh\",\"bodwad_teh\""

create_district "nandurbar_dist" "Nandurbar District" "nashik_div" \
"\"nandurbar_teh\",\"akkalkuwa_teh\",\"aikheda_teh\",\"taloda_teh\",\"shahada_teh\",\"navapur_teh\""

create_district "ahilyanagar_dist" "Ahilyanagar District" "nashik_div" \
"\"ahilyanagar_teh\",\"shrirampur_teh\",\"rahata_teh\",\"kopargaon_teh\",\"akole_teh\",\"sangamner_teh\",\"pathardi_teh\",\"shevgaon_teh\",\"jamkhed_teh\",\"parner_teh\",\"shrigonda_teh\",\"nevasa_teh\",\"rahuri_teh\""

############################
# PUNE DIVISION (5)
############################

create_district "pune_dist" "Pune District" "pune_div" \
"\"pune_teh\",\"haveli_teh\",\"mulshi_teh\",\"bhor_teh\",\"velhe_teh\",\"junnar_teh\",\"ambegaon_teh\",\"khed_teh\",\"shirur_teh\",\"baramati_teh\",\"indapur_teh\",\"daund_teh\",\"purandar_teh\",\"maval_teh\""

create_district "satara_dist" "Satara District" "pune_div" \
"\"satara_teh\",\"karad_teh\",\"wai_teh\",\"khandala_teh\",\"phaltan_teh\",\"man_teh\",\"khatav_teh\",\"patan_teh\",\"jaoli_teh\",\"mahabaleshwar_teh\""

create_district "sangli_dist" "Sangli District" "pune_div" \
"\"sangli_teh\",\"miraj_teh\",\"tasgaon_teh\",\"jath_teh\",\"kavathe_mahankal_teh\",\"atpadi_teh\",\"palus_teh\",\"khanapur_teh\",\"walwa_teh\""

create_district "solapur_dist" "Solapur District" "pune_div" \
"\"solapur_teh\",\"akkalkot_teh\",\"barshi_teh\",\"karmala_teh\",\"madha_teh\",\"malshiras_teh\",\"mohol_teh\",\"pandharpur_teh\",\"sangola_teh\",\"mangalvedha_teh\""

create_district "kolhapur_dist" "Kolhapur District" "pune_div" \
"\"kolhapur_teh\",\"karvir_teh\",\"panhala_teh\",\"hatkanangale_teh\",\"shirol_teh\",\"kagal_teh\",\"gadhinglaj_teh\",\"ajra_teh\",\"bhudargad_teh\",\"chandgad_teh\",\"radhanagari_teh\",\"shahuwadi_teh\""

############################
# MUMBAI DIVISION (7)
############################

create_district "mumbai_city_dist" "Mumbai City District" "mumbai_div" \
"\"mumbai_city_teh\""

create_district "mumbai_suburban_dist" "Mumbai Suburban District" "mumbai_div" \
"\"andheri_teh\",\"borivali_teh\",\"kurla_teh\""

create_district "thane_dist" "Thane District" "mumbai_div" \
"\"thane_teh\",\"kalyan_teh\",\"ulhasnagar_teh\",\"ambarnath_teh\",\"bhiwandi_teh\",\"shahapur_teh\",\"murbad_teh\""

create_district "palghar_dist" "Palghar District" "mumbai_div" \
"\"palghar_teh\",\"vasai_teh\",\"dahanu_teh\",\"talasari_teh\",\"jawhar_teh\",\"mokhada_teh\",\"vikramgad_teh\",\"wada_teh\""

create_district "raigad_dist" "Raigad District" "mumbai_div" \
"\"alibag_teh\",\"murud_teh\",\"pen_teh\",\"panvel_teh\",\"uran_teh\",\"karjat_teh\",\"khalapur_teh\",\"roha_teh\",\"mangaon_teh\",\"mahad_teh\",\"shrivardhan_teh\",\"tala_teh\",\"pali_teh\""

create_district "ratnagiri_dist" "Ratnagiri District" "mumbai_div" \
"\"ratnagiri_teh\",\"chiplun_teh\",\"guhagar_teh\",\"khed_teh\",\"mandangad_teh\",\"dapoli_teh\",\"rajapur_teh\",\"sangameshwar_teh\",\"lanja_teh\""

create_district "sindhudurg_dist" "Sindhudurg District" "mumbai_div" \
"\"sawantwadi_teh\",\"kudal_teh\",\"malvan_teh\",\"devgad_teh\",\"vaibhavwadi_teh\",\"dodamarg_teh\",\"kankavli_teh\""

echo "✅ All district JSON files created successfully in data/districts"