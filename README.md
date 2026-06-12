# 🩸 BloodLink AI

## Intelligent Emergency Blood Logistics Network

BloodLink AI is an intelligent emergency blood logistics platform designed to connect hospitals, blood banks, donors, and emergency services in real time.

The platform helps healthcare organizations efficiently manage blood inventory, process urgent blood requests, reduce blood wastage, and improve emergency response through smart analytics and decision-support systems.

---

# 🚀 Key Features

## 🔐 Secure Authentication & Authorization

- JWT-based Authentication
- Role-Based Access Control (RBAC)
- Separate access levels for:
  - Admin
  - Hospital
  - Blood Bank
  - Donor

---

## 🩸 Blood Inventory Management

- Real-time blood inventory tracking
- Blood group availability monitoring
- Expiry date management
- Inventory updates after donations and transfers

---

## 🏥 Emergency Blood Request Management

Hospitals can:

- Create emergency blood requests
- Track request status
- View available blood sources
- Initiate urgent blood requirements

---

## 👨‍⚕️ Donor Management

- Donor registration
- Donor profile management
- Donation history tracking
- Emergency donor notifications

---

## 📊 Smart Analytics & Decision Support

### Blood Shortage Prediction

Analyzes current inventory levels and identifies blood groups at risk of shortage.

**Benefits:**
- Early shortage detection
- Better inventory planning
- Improved blood collection campaigns

---

### Intelligent Donor Ranking

Ranks donors using:

- Active status
- Donation history
- Profile completeness

**Benefits:**
- Prioritizes reliable donors
- Improves emergency response time
- Reduces unnecessary notifications

---

### Expiry Rescue Intelligence

Detects blood units approaching expiry and recommends actions.

**Benefits:**
- Reduces blood wastage
- Improves inventory utilization
- Supports proactive decision-making

---

### Heatmap Analytics

Visualizes shortage-prone regions and emergency demand areas.

**Benefits:**
- Better resource allocation
- Improved emergency planning
- Demand hotspot identification

---

## 🔄 Blood Transfer Management

Supports blood transfers between:

- Hospitals
- Blood Banks

Tracks:

- Source facility
- Destination facility
- Quantity transferred
- Transfer status

---

## 🔔 Notification System

Automated notifications for:

- Emergency blood requests
- Expiring blood inventory
- Shortage alerts
- Transfer updates

---

# 🛠 Technology Stack

## Backend
- FastAPI
- Python 3.10+

## Database
- PostgreSQL

## ORM
- SQLAlchemy (Async)

## Authentication
- JWT
- Python-Jose
- Passlib (bcrypt)

## Analytics & Intelligence
- Scikit-Learn
- Blood Shortage Prediction
- Donor Ranking Engine
- Expiry Monitoring
- Heatmap Analytics

## Validation
- Pydantic v2

## API Documentation
- Swagger UI
- ReDoc

---

# 📂 Project Structure

```text
logistics-transit/
├── app/
│   ├── api/                  # API Routes
│   ├── core/                 # Configurations & Security
│   ├── db/                   # Database Sessions
│   ├── models/               # SQLAlchemy Models
│   ├── repositories/         # Database Operations
│   ├── schemas/              # Pydantic Schemas
│   ├── services/             # Business Logic & Analytics
│   │   ├── prediction.py
│   │   ├── donor_ranking.py
│   │   └── expiry.py
│
├── main.py                   # Application Entry Point
├── create_tables.py
├── requirements.txt
├── .env
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

- Python 3.10+
- PostgreSQL
- Git

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd logistics-transit
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

Linux/macOS:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file:

```env
SECRET_KEY=your_secret_key

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bloodlink_db

ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520
```

### 5. Initialize Database

```bash
python create_tables.py
```

or

```bash
alembic upgrade head
```

---

# ▶️ Running the Application

Start the server:

```bash
uvicorn main:app --reload
```

Server URL:

```text
http://localhost:8000
```

Swagger Documentation:

```text
http://localhost:8000/docs
```

ReDoc Documentation:

```text
http://localhost:8000/redoc
```

---

# 📡 API Modules

| Module | Description |
|----------|-------------|
| Authentication | Registration & Login |
| Inventory | Blood Inventory Management |
| Requests | Emergency Blood Requests |
| Donors | Donor Management |
| Transfers | Blood Transfer Management |
| Donations | Donation Tracking |
| Notifications | Alerts & Updates |
| Analytics | Decision Support & Monitoring |

---

## Analytics Endpoints

| Endpoint | Description |
|-----------|-------------|
| `/api/v1/analytics/shortage-prediction` | Predict blood shortages |
| `/api/v1/analytics/donor-ranking` | Rank donors based on reliability |
| `/api/v1/analytics/expiry-alerts` | Detect expiring blood units |
| `/api/v1/analytics/heatmap` | Heatmap analytics |

---

# 👥 Team Members

| Role | Team Member |
|--------|-------------|
| Backend Developer | B. Chakri |
| Frontend Developer | Subba Reddy |
| Analytics & Intelligence | Sreeram Rishitha |
| Maps & Integration | Bhavya Sai |

---

# 🎯 Hackathon Highlights

✅ Blood Shortage Prediction

✅ Intelligent Donor Ranking

✅ Expiry Rescue Intelligence

✅ Emergency Blood Request Matching

✅ Real-Time Inventory Management

✅ Heatmap Analytics

✅ Blood Transfer Management

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push to GitHub

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

# 📄 License

This project is developed for educational, research, and hackathon purposes.