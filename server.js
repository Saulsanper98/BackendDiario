require('dotenv').config();
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origen no permitido por CORS."));
    },
    credentials: true
  })
);

app.use(express.json());

app.use("/api/notes", require("./routes/notes"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/postit", require("./routes/postit"));
app.use("/api/docs", require("./routes/docs"));
app.use("/api/handovers", require("./routes/handovers"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/users", require("./routes/users"));
app.use('/api/files', require('./routes/files'));
app.use('/api/workgroups', require('./routes/workgroups'));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

const { notifyOverdueTask } = require('./services/teamsNotifier');
const { syncUsersFromEntra } = require('./services/entraSync');
const Project = require('./models/Project');

// Verificar tareas vencidas cada día a las 8:00
function checkOverdueTasks() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  Project.find({})
    .then((projects) => {
      projects.forEach((project) => {
        (project.tasks || []).forEach((task) => {
          if (!task.done && task.dueDate && task.dueDate < today) {
            notifyOverdueTask(task, project, project.department).catch(console.error);
          }
        });
      });
    })
    .catch(console.error);
}

// Ejecutar a las 8:00 cada día
function scheduleDaily8am() {
  const now = new Date();
  const next8am = new Date();
  next8am.setHours(8, 0, 0, 0);
  if (next8am <= now) next8am.setDate(next8am.getDate() + 1);
  const msUntil8am = next8am - now;
  setTimeout(() => {
    checkOverdueTasks();
    setInterval(checkOverdueTasks, 24 * 60 * 60 * 1000);
  }, msUntil8am);
}

scheduleDaily8am();

// Sincronizar usuarios al arrancar
setTimeout(() => {
  console.log('=== Iniciando sync de usuarios Entra ID ===');
  syncUsersFromEntra()
    .then(() => console.log('=== Sync completado ==='))
    .catch((err) => console.error('=== Error en sync:', err.message, '==='));
}, 5000);
