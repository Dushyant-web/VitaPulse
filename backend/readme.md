# Cardiovascular Disease Risk Prediction – Backend

This backend provides a REST API to predict cardiovascular disease risk
using a trained Machine Learning model.

---

## Tech Stack
- Python 3.11
- Flask
- scikit-learn
- pandas, numpy

---

## API Endpoint

### POST /predict

#### Request Body (JSON)
```json
{
  "age": 45,
  "gender": 2,
  "height": 170,
  "weight": 72,
  "ap_hi": 130,
  "ap_lo": 85,
  "cholesterol": 2,
  "gluc": 1,
  "smoke": 0,
  "alco": 0,
  "active": 1
}


## Run Locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py

This prevents confusion for teammates.

---

## 5️⃣ Deployment readiness (you don’t deploy yet, just prepare)

### Add this file:

#### to get token in chrome console

''firebase.auth().currentUser.getIdToken().then(token => {
  console.log(token);
});''