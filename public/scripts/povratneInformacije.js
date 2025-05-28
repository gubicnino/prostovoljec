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
            <div class="card-body">
                <h5 class="card-title">${u.ime} ${u.primek}</h5>
                <div class="row">
                    <div class="col-md-4">
                        <label class="form-label">Ocena (1-5)</label>
                        <select class="form-select" name="ocena-${u.idProstovoljec}">
                            <option value="">Brez ocene</option>
                            <option value="1"${u.ocena == 1 ? " selected" : ""}>1 - Slabo</option>
                            <option value="2"${u.ocena == 2 ? " selected" : ""}>2 - Povprečno</option>
                            <option value="3"${u.ocena == 3 ? " selected" : ""}>3 - Dobro</option>
                            <option value="4"${u.ocena == 4 ? " selected" : ""}>4 - Zelo dobro</option>
                            <option value="5"${u.ocena == 5 ? " selected" : ""}>5 - Odlično</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Komentar</label>
                        <textarea class="form-control" name="komentar-${u.idProstovoljec}" rows="1">${u.komentar || ""}</textarea>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Potrditev udeležbe</label>
                        <select class="form-select" name="potrditev-${u.idProstovoljec}">
                            <option value="">Potrdi udeležbo</option>
                            <option value="1"${u.potrejno == 1 ? " selected" : ""}>Da</option>
                            <option value="0"${u.potrejno == 0 ? " selected" : ""}>Ne</option>
                        </select>
                    </div>
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

        try {
            const res = await fetch(`/api/projekti/${projectId}/volunteers/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbacks: results }),
            });

            if (res.ok) {
                alert("Povratne informacije uspešno shranjene! Obvestili ste bili vsi udeleženci o potrditvi/zavrnitvi.");
                
                // Posodobi obvestila
                if (window.notificationManager) {
                    setTimeout(() => {
                        window.notificationManager.loadNotifications();
                        window.notificationManager.updateNotificationBadge();
                    }, 500);
                }
                
                window.location.reload();
            } else {
                alert("Napaka pri shranjevanju povratnih informacij.");
            }
        } catch (error) {
            console.error('Napaka:', error);
            alert("Prišlo je do napake. Poskusite znova.");
        }
    });
});