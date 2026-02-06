#!/bin/bash

mkdir -p data/depots

cat > data/depots/warora_bus_stand_depot.json << 'EOF'
{
  "id": "warora_bus_stand_depot",
  "name": "Warora Bus Stand Timetable 2026 | MSRTC Ticket Price",
  "type": "depot",
  "tehsil_id": "warora_teh",
  "address": "Warora Bus Stand, Chandrapur - 442907",
  "contact": "",
  "total_buses": 0,
  "villages": {
    "c": [
      { "name": "Chandrapur", "schedule": ["05:25","06:00","06:30","06:45","06:50","07:10","07:30","07:40","08:05","08:35","09:20","09:35","09:50","10:05","10:15","10:30","11:10","11:30","11:50","12:10","12:40","13:00","13:15","13:20","13:30","13:35","13:40","14:00","14:10","14:15","14:35","14:40","15:00","15:30","15:40","15:45","16:10","16:20","16:25","17:00","17:20","17:35","18:15","18:20","19:35","20:35","20:45"], "bus_count": 47 }
    ],
    "n": [
      { "name": "Nagpur", "schedule": ["06:35","07:35","08:05","09:35","10:00","12:05","13:35","14:35","15:35","17:40"], "bus_count": 10 }
    ],
    "y": [
      { "name": "Yavatmal", "schedule": ["05:40","06:35","07:00","07:50","09:05","09:30","09:35","10:15","10:25","13:05","14:20","15:00","15:20","15:35","16:20","16:50","17:05","17:35","19:05","20:05"], "bus_count": 20 }
    ],
    "w": [
      { "name": "Wani", "schedule": ["06:00","06:35","06:40","07:00","07:40","07:50","08:30","08:35","08:50","08:55","09:05","09:30","09:35","09:55","10:25","10:30","10:50","11:05","11:10","11:30","11:35","11:45","11:50","11:55","12:05","12:35","12:50","13:05","13:10","13:20","13:45","14:00","14:05","14:20","14:25","15:00","15:35","15:45","16:15","16:20","16:50","17:05","17:10","17:35","17:50","18:20","19:05","19:20","19:25","20:05","20:20","20:45"], "bus_count": 52 }
    ]
  },
  "content": {
    "about": "<p>वरोरा बस स्थानक (Warora Bus Stand) हे चंद्रपूर जिल्ह्यातील एक महत्त्वाचे MSRTC बस स्थानक आहे. येथेून चंद्रपूर, नागपूर, यवतमाळ, वणी आणि आसपासच्या ग्रामीण भागांसाठी नियमित बस सेवा उपलब्ध आहे. Warora bus stand daily handles a large number of passengers including students, office commuters, traders, and long-distance travelers.</p><p>बस स्थानक स्वच्छ, सुव्यवस्थित आणि प्रवाशांसाठी सुरक्षित आहे. वेळापत्रक स्पष्टपणे दर्शवलेले असल्यामुळे प्रवाशांना प्रवासाचे नियोजन करणे सोपे जाते. ग्रामीण भागातील प्रवाशांसाठी हे स्थानक एक महत्त्वाचे संपर्क केंद्र आहे.</p>",
    "faqs": [
      { "question": "Warora Bus Stand कुठे आहे?", "answer": "Warora Bus Stand चंद्रपूर जिल्ह्यातील वरोरा शहरात स्थित आहे." },
      { "question": "वरोरा ते चंद्रपूर बस किती वेळाने मिळते?", "answer": "वरोरा ते चंद्रपूर मार्गावर दिवसभर वारंवार बस उपलब्ध आहे." },
      { "question": "नागपूरसाठी बस आहे का?", "answer": "होय, वरोरा बस स्थानकातून नागपूरसाठी नियमित ST बस सेवा आहे." },
      { "question": "यवतमाळ आणि वणीसाठी थेट बस मिळते का?", "answer": "होय, यवतमाळ व वणीसाठी सकाळपासून रात्रीपर्यंत अनेक फेऱ्या आहेत." },
      { "question": "Warora Bus Stand वर ग्रामीण बस सेवा आहे का?", "answer": "होय, आसपासच्या गावांसाठी नियमित ग्रामीण बस सेवा उपलब्ध आहे." }
    ],
    "seo_content": {
      "title": "Warora Bus Stand Timetable 2026 | MSRTC Bus Schedule",
      "content": "<p>Warora Bus Stand provides updated MSRTC bus timetable for Chandrapur, Nagpur, Yavatmal, Wani and nearby villages. Passengers can check accurate timings and plan their travel easily.</p>"
    }
  },
  "seo": {
    "title": "Warora Bus Stand Timetable 2026 | MSRTC Ticket Price",
    "description": "View updated Warora Bus Stand timetable 2026 with MSRTC bus schedules for Chandrapur, Nagpur, Yavatmal and Wani routes.",
    "keywords": "Warora bus stand timetable, warora msrtc bus schedule, warora to chandrapur bus, warora to nagpur bus"
  }
}
EOF

echo "✅ Warora Bus Stand JSON created successfully"
