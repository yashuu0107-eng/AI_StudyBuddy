const $ = (id) => document.getElementById(id);
const API = "/api/materials";
let currentId = null;

async function api(path = "", method = "GET", body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function setStatus(msg, isError = false) {
  $("status").textContent = msg;
  $("status").className = isError ? "error" : "";
}

async function loadList() {
  const items = await api();
  $("list").innerHTML = items.length
    ? items.map((m) => `<li data-id="${m._id}" class="${m._id === currentId ? "active" : ""}">${esc(m.title)}</li>`).join("")
    : "<li style='cursor:default;color:var(--muted)'>Nothing yet</li>";
}

$("list").addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (li) selectMaterial(li.dataset.id);
});

$("saveBtn").addEventListener("click", async () => {
  const title = $("title").value.trim();
  const content = $("content").value.trim();
  if (!title || !content) return alert("Please enter a title and some notes.");
  try {
    const m = await api("", "POST", { title, content });
    $("title").value = "";
    $("content").value = "";
    await selectMaterial(m._id);
  } catch (err) {
    alert(err.message);
  }
});

async function selectMaterial(id) {
  currentId = id;
  const m = await api("/" + id);
  $("mTitle").textContent = m.title;
  $("mContent").textContent = m.content;
  $("workspace").classList.remove("hidden");
  $("empty").classList.add("hidden");
  $("result").innerHTML = "";
  setStatus("");
  await Promise.all([loadList(), loadHistory()]);
}

$("delBtn").addEventListener("click", async () => {
  if (!confirm("Delete this material and its generated resources?")) return;
  await api("/" + currentId, "DELETE");
  currentId = null;
  $("workspace").classList.add("hidden");
  $("empty").classList.remove("hidden");
  loadList();
});

let saved = [];
async function loadHistory() {
  saved = await api(`/${currentId}/resources`);
  $("history").innerHTML = saved.length
    ? "<span style='color:var(--muted);font-size:.8rem'>Saved:</span>" +
      saved.map((r, i) => `<button data-i="${i}">${r.type} · ${new Date(r.createdAt).toLocaleString()}</button>`).join("")
    : "";
}

$("history").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-i]");
  if (b) render(saved[b.dataset.i]);
});

document.querySelector(".row:not(.between)").addEventListener("click", async (e) => {
  const type = e.target.dataset.type;
  if (!type) return;
  const body = {
    level: $("level").value,
    count: Number($("count").value),
    difficulty: $("difficulty").value,
    days: Number($("days").value),
  };
  setStatus("Asking Gemini… this can take a few seconds.");
  document.querySelectorAll("[data-type]").forEach((b) => (b.disabled = true));
  try {
    const resource = await api(`/${currentId}/${type}`, "POST", body);
    setStatus("");
    render(resource);
    loadHistory();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    document.querySelectorAll("[data-type]").forEach((b) => (b.disabled = false));
  }
});

function render(r) {
  const out = $("result");
  if (r.type === "summary") {
    out.innerHTML = `<div class="summary">${esc(r.data)}</div>`;
  } else if (r.type === "flashcards") {
    out.innerHTML =
      '<p style="color:var(--muted)">Click a card to flip it.</p><div class="cards">' +
      r.data.map((c) => `<div class="card" data-front="${esc(c.front)}" data-back="${esc(c.back)}">${esc(c.front)}</div>`).join("") +
      "</div>";
    out.querySelectorAll(".card").forEach((el) =>
      el.addEventListener("click", () => {
        const flipped = el.classList.toggle("flipped");
        el.textContent = flipped ? el.dataset.back : el.dataset.front;
      })
    );
  } else if (r.type === "quiz") {
    renderQuiz(r.data);
  } else if (r.type === "study-plan") {
    out.innerHTML = r.data
      .map(
        (d) => `<div class="day"><h3>Day ${esc(String(d.day))}: ${esc(d.focus)}</h3>
        <ul>${(d.tasks || []).map((t) => `<li>• ${esc(t)}</li>`).join("")}</ul>
        ${d.review ? `<p style="color:var(--muted)">Review: ${esc(d.review)}</p>` : ""}</div>`
      )
      .join("");
  }
}

function renderQuiz(questions) {
  let answered = 0, correct = 0;
  const out = $("result");
  out.innerHTML = '<div id="score">Score: 0 / ' + questions.length + "</div>";
  questions.forEach((q, qi) => {
    const box = document.createElement("div");
    box.className = "q";
    box.innerHTML =
      `<strong>${qi + 1}. ${esc(q.question)}</strong>` +
      q.options.map((o, oi) => `<button data-o="${oi}">${esc(o)}</button>`).join("") +
      '<div class="why"></div>';
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-o]");
      if (!b || box.dataset.done) return;
      box.dataset.done = "1";
      const pick = Number(b.dataset.o);
      box.querySelectorAll("button").forEach((btn, i) => {
        if (i === q.answerIndex) btn.classList.add("right");
        else if (i === pick) btn.classList.add("wrong");
      });
      box.querySelector(".why").textContent = q.explanation || "";
      answered++;
      if (pick === q.answerIndex) correct++;
      $("score").textContent = `Score: ${correct} / ${questions.length}` + (answered === questions.length ? " — done!" : "");
    });
    out.appendChild(box);
  });
}

loadList();
