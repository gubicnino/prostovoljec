document.addEventListener("DOMContentLoaded", async () => {
    const projectId = new URLSearchParams(window.location.search).get('projektId');
    const participantsList = document.getElementById('participantsList');
    const feedbackForm = document.getElementById('feedbackForm');
    const naslovProjekt = document.getElementById('naslovProjekt');
    
    // Pridobi podatke o projektu
    const res = await fetch(`/api/projekti/${projectId}`);
    if (res.ok) {
        const projekt = await res.json();
        naslovProjekt.textContent = `Povratne informacije udeležencev za projekt ${projekt.naziv}`;
    } else {
        naslovProjekt.textContent = "Povratne informacije udeležencev";
    }
    // Pridobi udeležence iz backend-a
    async function fetchParticipants(projectId) {
        const res = await fetch(`/api/projekti/${projectId}/volunteers/vsi`);
        if (!res.ok) {
            alert("Napaka pri pridobivanju udeležencev!");
            return [];
        }
        return await res.json();
    }

    // Prikaži udeležence
    const participants = await fetchParticipants(projectId);
    participantsList.innerHTML = participants.map(u => `
        <div class="card mb-3">
            <div class="card-body row align-items-center">
                <div class="col-md-3 fw-bold">${u.ime} ${u.primek ? u.primek : ""}</div>
                <div class="col-md-3">
                    <input type="text" class="form-control" name="komentar-${u.idProstovoljec}" placeholder="Komentar" value="${u.komentar || ''}">
                </div>
                <div class="col-md-2">
                    <select class="form-select" name="ocena-${u.idProstovoljec}">
                        <option value="">Ocena</option>
                        ${[1,2,3,4,5].map(n => `<option value="${n}"${String(u.ocena) == String(n) ? " selected" : ""}>${n}</option>`).join('')}
                    </select>   
                </div>
                <div class="col-md-2">
                    <select class="form-select" name="potrditev-${u.idProstovoljec}">
                        <option value="">Potrdi udeležbo</option>
                        <option value="1"${u.potrejno == 1 ? " selected" : ""}>Da</option>
                        <option value="0"${u.potrejno == 0 ? " selected" : ""}>Ne</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');

    // Shrani podatke
    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const results = participants.map(u => ({
            id: u.idProstovoljec,
            komentar: feedbackForm[`komentar-${u.idProstovoljec}`].value,
            ocena: feedbackForm[`ocena-${u.idProstovoljec}`].value === "" ? null : feedbackForm[`ocena-${u.idProstovoljec}`].value,
            potrditev: feedbackForm[`potrditev-${u.idProstovoljec}`].value === "" ? null : feedbackForm[`potrditev-${u.idProstovoljec}`].value
        }));
        console.log(results);

        const res = await fetch(`/api/projekti/${projectId}/volunteers/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedbacks: results }),
        });
        console.log(res);

        if (res.ok) {
            alert("Povratne informacije uspešno shranjene!");
            window.location.reload();
        } else {
            alert("Napaka pri shranjevanju povratnih informacij.");
        }

    });
});