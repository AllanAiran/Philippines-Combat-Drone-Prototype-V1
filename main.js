function launchSwarm() {
  document.getElementById("status").innerText = "Launching Swarm...";

  console.log("Swarm launched.");
}

function abortMission() {
  document.getElementById("status").innerText = "Mission Aborted";

  console.warn("Mission aborted.");
}

function selfDestruct() {
  if (confirm("Are you sure you want to self-destruct all drones?")) {
    document.getElementById("status").innerText = "Self-Destruct Activated";

    console.error("Drones self-destruct initiated.");
  }
}

async function startPhoneCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }, // use back camera
      audio: false
    });

    const video = document.getElementById("droneFeed");
    video.srcObject = stream;
  } catch (error) {
    console.error("Camera error:", error);
    alert("Camera access denied or unavailable.");
  }
}

startPhoneCamera();
// Simulate live telemetry update

setInterval(() => {
  document.getElementById("battery").innerText =
    Math.floor(Math.random() * 100) + "%";

  document.getElementById("altitude").innerText =
     Math.floor(Math.random() * 5000) + " m";

  document.getElementById("speed").innerText =
    Math.floor(Math.random() * 300) + " km/h";

  document.getElementById("signal").innerText =
    Math.floor(Math.random() * 100) + "%";
}, 3000);

const video = document.getElementById("webcam");

const canvas = document.getElementById("overlay");

const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");

function getColor(label) {
  const enemies = [
    "military ship",
    "rifle",
    "tank",
    "missile",
    "aircraft carrier"
  ];

  const friends = ["friendly soldier", "ally drone", "rescue ship"];

  const humans = ["person"];

  if (enemies.includes(label)) return "red";

  if (friends.includes(label)) return "green";

  if (humans.includes(label)) return "blue";

  return "blue";
}

async function startAI() {
  const model = await cocoSsd.load();

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    video.play();

    detectFrame(model);
  };
}

async function detectFrame(model) {
  canvas.width = video.videoWidth;

  canvas.height = video.videoHeight;

  const predictions = await model.detect(video);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  predictions.forEach((pred) => {
    const [x, y, width, height] = pred.bbox;

    const color = getColor(pred.class);

    ctx.strokeStyle = color;

    ctx.lineWidth = 2;

    ctx.strokeRect(x, y, width, height);

    ctx.font = "14px monospace";

    ctx.fillStyle = color;

    ctx.fillText(`${pred.class} (${(pred.score * 100).toFixed(1)}%)`, x, y - 5);
  });

  statusText.textContent = `Detected ${predictions.length} object(s)`;

  requestAnimationFrame(() => detectFrame(model));
  }

startAI();

fetch("https://raw.githubusercontent.com/AllanAiran/data.json/main/data.json")
  .then((response) => response.json())

  .then((data) => {
    console.log("Loaded JSON:", data);
  })

  .catch((error) => {
    console.error("Error loading JSON:", error);
  });

const drones = [];

for (let i = 1; i <= 20; i++) {
  drones.push({
    id: i,

    status: "ready", // ready, active, destroyed

    cameraUrl: `https://live-feed-server/drone${i}`, // replace with real stream URL

    position: { x: 0, y: 0, z: 0 }, // initial position (for formation logic)

    velocity: { x: 0, y: 0, z: 0 } // for formation + evasion later
  });
}

let leadDroneId = null;

function updateDroneStatusDisplay() {
  const list = document.getElementById("droneList");

  list.innerHTML = "";

  drones.forEach((drone) => {
    const li = document.createElement("li");

   li.textContent = `Drone ${drone.id} - ${drone.status}`;

    if (drone.id === leadDroneId) li.style.fontWeight = "bold";

    list.appendChild(li);
  });
}

function updateLeadDrone() {
  const lead = drones.find((d) => d.status === "active");

  if (lead) {
    leadDroneId = lead.id;

    const video = document.getElementById("liveCamera");

    video.src = lead.cameraUrl;

    console.log(`Live view switched to Drone ${lead.id}`);
  } else {
    console.log("No active drone for live view");

    leadDroneId = null;

    document.getElementById("liveCamera").src = "";
  }
}

function launchDrone(id) {
  const drone = drones.find((d) => d.id === id);

  if (drone && drone.status === "ready") {
    drone.status = "active";

    console.log(`Drone ${id} launched.`);

    if (!leadDroneId) updateLeadDrone(); // first launched becomes lead

    updateDroneStatusDisplay();
  }
}

// Optional: Launch all drones

function launchAllDrones() {
  drones.forEach((d) => {
    if (d.status === "ready") launchDrone(d.id);
  });
}

function assignTargets(drones, enemies) {
  const assignedEnemies = new Set();

  drones.forEach((drone) => {
    if (drone.status === "Destroyed") return;

    let closestEnemy = null;

    let closestDistance = Infinity;

    enemies.forEach((enemy) => {
      if (assignedEnemies.has(enemy.id)) return;

      const dx = enemy.x - drone.x;

      const dy = enemy.y - drone.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;

        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      drone.targetId = closestEnemy.id;

      drone.status = "Engaged";

      assignedEnemies.add(closestEnemy.id);
    }
  });
}

const DRONE_URL =
  "https://raw.githubusercontent.com/AllanAiran/data.json/main/drones.json";

const ENEMY_URL =
  "https://raw.githubusercontent.com/AllanAiran/data.json/main/enemies.json";
