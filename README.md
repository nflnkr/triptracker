# Tool for storing and editing gps data
---
https://user-images.githubusercontent.com/105123049/194877724-ddacc064-57fc-4af6-973f-f88899b5a867.mp4

---
## Libraries used
### Frontend
- React
- Materual UI
- Styled Components
- React-router-dom
- Openlayers
- ChartJS
- Formik
- Jest
### Backend
- Express
- Mongoose
- PassportJS
## Launch in dev mode
- Get your [thunderforest api key](https://www.thunderforest.com/)
- Create .env file in ./backend/ :
```
# Default: 3001. Change CRA proxy in package.json appropriately if changed
SERVER_PORT=
# Default: localhost
SERVER_HOSTNAME=
# Mongodb instance url. Default: mongodb://127.0.0.1:27017/
MONGODB_URL=
# Secret for express-session
SESSION_SECRET=
THUNDERFOREST_API_KEY=
```
- In ./backend/
```ps
npm install
npm start
```
- In ./frontend/
```ps
npm install
npm start
```


