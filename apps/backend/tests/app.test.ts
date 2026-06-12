import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { demoCenters, demoEmergencyAlerts, demoEmergencyFeed, MemoryStore } from '../src/data/memoryStore';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(new MemoryStore());
});

describe('Hemora backend API', () => {
  it('returns a healthcheck', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('hemora-backend');
  });

  it('returns collection centers', async () => {
    const response = await request(app).get('/api/centers').expect(200);

    expect(response.body.data).toHaveLength(demoCenters.length);
    expect(response.body.data[0]).toMatchObject({
      id: 'center_1',
      city: 'Salerno',
      name: 'Centro Medicina Trasfusionale AOU Ruggi',
    });
  });

  it('filters collection centers by user location and radius', async () => {
    const response = await request(app)
      .get('/api/centers?lat=40.6824&lon=14.7681&radiusKm=10')
      .expect(200);

    const ids = response.body.data.map((center: { id: string }) => center.id);
    expect(ids).toContain('center_2');
    expect(ids).toContain('center_3');
    expect(ids).not.toContain('center_campania_nord_avellino_moscati');
    expect(response.body.data.length).toBeLessThan(demoCenters.length);
  });

  it('rejects invalid center geo filters', async () => {
    await request(app).get('/api/centers?lat=abc&lon=14.7681').expect(400);
    await request(app).get('/api/centers?lat=40.6824&lon=14.7681&radiusKm=-1').expect(400);
  });

  it('returns a single center and 404 for unknown ids', async () => {
    const ok = await request(app).get('/api/centers/center_1').expect(200);
    expect(ok.body.data.id).toBe('center_1');

    await request(app).get('/api/centers/center_999').expect(404);
  });

  it('returns active emergency blood alerts by default', async () => {
    const response = await request(app).get('/api/emergency-alerts').expect(200);

    expect(response.body.data).toHaveLength(demoEmergencyAlerts.length);
    expect(response.body.data[0]).toMatchObject({
      requestedGroup: '0',
      rh: '-',
      urgency: 'Alta',
    });
  });

  it('filters emergencies by donor compatibility and city', async () => {
    // A Salerno c'e solo la richiesta 0-, compatibile con un donatore 0-.
    const salerno = await request(app)
      .get('/api/emergencies?bloodType=0&rh=negative&city=Salerno')
      .expect(200);
    expect(salerno.body.data).toHaveLength(1);
    expect(salerno.body.data[0].requestedGroup).toBe('0');

    // A+ non puo donare a un ricevente 0-, ma puo donare ad AB+ (ricevente
    // universale): vede solo l'emergenza AB+.
    const aPositive = await request(app)
      .get('/api/emergencies?bloodType=A&rh=positive')
      .expect(200);
    expect(aPositive.body.data).toHaveLength(1);
    expect(aPositive.body.data[0].requestedGroup).toBe('AB');

    // 0- e donatore universale: compatibile con entrambe le emergenze.
    const zeroNegative = await request(app)
      .get('/api/emergencies?bloodType=0&rh=negative')
      .expect(200);
    expect(zeroNegative.body.data).toHaveLength(2);
  });

  it('exposes the shared donation wait-days rules', async () => {
    const response = await request(app).get('/api/donation-rules').expect(200);

    expect(response.body.data.types).toHaveLength(3);
    expect(response.body.data.waitDays['Sangue intero']['Sangue intero']).toBe(90);
    expect(response.body.data.waitDays.Plasma['Sangue intero']).toBe(14);
  });

  it('computes donation eligibility with the shared rules', async () => {
    // Senza ultima donazione l'utente e sempre idoneo.
    const eligible = await request(app)
      .get('/api/donation-eligibility?type=Plasma')
      .expect(200);
    expect(eligible.body.data.eligible).toBe(true);
    expect(eligible.body.data.nextEligibleDate).toBeNull();

    // Sangue intero oggi -> prossimo sangue intero tra 90 giorni: non idoneo.
    const today = new Date().toISOString().slice(0, 10);
    const notEligible = await request(app)
      .get(`/api/donation-eligibility?type=Sangue intero&lastType=Sangue intero&lastDonationDate=${today}`)
      .expect(200);
    expect(notEligible.body.data.eligible).toBe(false);
    expect(notEligible.body.data.waitDays).toBe(90);
    expect(notEligible.body.data.nextEligibleDate).not.toBeNull();

    await request(app).get('/api/donation-eligibility?type=Boh').expect(400);
    await request(app).get('/api/donation-eligibility?type=Plasma&lastType=Boh').expect(400);
  });

  it('returns the emergency feed for push simulation', async () => {
    const response = await request(app).get('/api/emergency-feed').expect(200);

    expect(response.body.data).toHaveLength(demoEmergencyFeed.length);
    expect(response.body.data[0]).toMatchObject({
      id: demoEmergencyFeed[0].id,
      title: demoEmergencyFeed[0].title,
    });
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown').expect(404);

    expect(response.body.error).toBe('Not found');
  });
});

// Slot futuro in un giorno feriale (alle `hour`), in orario valido (8–12).
function futureWeekdaySlot(hour = 9): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${String(hour).padStart(2, '0')}:00:00`;
}

// Primo sabato futuro (slot non valido).
function futureWeekendSlot(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T09:00:00`;
}

const USER = { 'X-User-Email': 'mario@hemora.test' };

describe('Hemora bookings API', () => {
  it('rejects bookings without the user header', async () => {
    await request(app).get('/api/bookings').expect(400);
    await request(app)
      .post('/api/bookings')
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot() })
      .expect(400);
  });

  it('creates a booking and lists it for that user', async () => {
    const created = await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot() })
      .expect(201);

    expect(created.body.data).toMatchObject({
      centerId: 'center_1',
      centerName: 'Centro Medicina Trasfusionale AOU Ruggi',
      type: 'Plasma',
      status: 'Confermata',
    });
    expect(created.body.data.id).toBeTruthy();

    const list = await request(app).get('/api/bookings').set(USER).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(created.body.data.id);
  });

  it('isolates bookings per user (chiave = email)', async () => {
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot() })
      .expect(201);

    const other = await request(app)
      .get('/api/bookings')
      .set({ 'X-User-Email': 'altro@hemora.test' })
      .expect(200);
    expect(other.body.data).toHaveLength(0);
  });

  it('rejects an unknown center', async () => {
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_999', type: 'Plasma', dateTime: futureWeekdaySlot() })
      .expect(400);
  });

  it('rejects weekend slots', async () => {
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekendSlot() })
      .expect(400);
  });

  it('rejects a second active booking for the same type', async () => {
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot(9) })
      .expect(201);

    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot(10) })
      .expect(409);
  });

  it('allows only one active booking at a time (any type or slot)', async () => {
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot(9) })
      .expect(201);

    // Tipo diverso E slot diverso: comunque rifiutata (una sola alla volta).
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_2', type: 'Sangue intero', dateTime: futureWeekdaySlot(11) })
      .expect(409);
  });

  it('clears all bookings for the user (reset account) and unblocks new ones', async () => {
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot(9) })
      .expect(201);

    // DELETE senza id = cancella tutte le prenotazioni dell'utente.
    await request(app).delete('/api/bookings').set(USER).expect(200);

    const list = await request(app).get('/api/bookings').set(USER).expect(200);
    expect(list.body.data).toHaveLength(0);

    // Dopo il reset si può prenotare di nuovo (niente prenotazione "fantasma").
    await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Sangue intero', dateTime: futureWeekdaySlot(10) })
      .expect(201);
  });

  it('requires the user header to clear bookings', async () => {
    await request(app).delete('/api/bookings').expect(400);
  });

  it('cancels a booking and is idempotent on a second delete', async () => {
    const created = await request(app)
      .post('/api/bookings')
      .set(USER)
      .send({ centerId: 'center_1', type: 'Plasma', dateTime: futureWeekdaySlot() })
      .expect(201);

    await request(app).delete(`/api/bookings/${created.body.data.id}`).set(USER).expect(200);
    await request(app).delete(`/api/bookings/${created.body.data.id}`).set(USER).expect(404);

    const list = await request(app).get('/api/bookings').set(USER).expect(200);
    expect(list.body.data).toHaveLength(0);
  });
});
