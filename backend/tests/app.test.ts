import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { demoCenters, demoEmergencyAlerts, MemoryStore } from '../src/data/memoryStore';

// Ricreiamo l'app prima di ogni test così le prenotazioni in memoria non
// si accumulano tra un test e l'altro.
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

  it('returns simulated slots for a center', async () => {
    const response = await request(app).get('/api/centers/center_1/slots').expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toMatchObject({ centerId: 'center_1' });
  });

  it('creates, lists and cancels a booking', async () => {
    const created = await request(app)
      .post('/api/bookings')
      .send({ userId: 'user_1', centerId: 'center_1', type: 'Plasma' })
      .expect(201);

    const bookingId = created.body.data.id;
    expect(created.body.data).toMatchObject({ centerId: 'center_1', status: 'Confermata' });

    const list = await request(app).get('/api/bookings?userId=user_1').expect(200);
    expect(list.body.data).toHaveLength(1);

    const cancelled = await request(app)
      .delete(`/api/bookings/${bookingId}?userId=user_1`)
      .expect(200);
    expect(cancelled.body.data.status).toBe('Annullata');
  });

  it('rejects bookings with invalid payload', async () => {
    await request(app).post('/api/bookings').send({ centerId: 'center_1' }).expect(400);
    await request(app)
      .post('/api/bookings')
      .send({ centerId: 'center_999', type: 'Plasma' })
      .expect(404);
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
    // 0- è donatore universale: compatibile con la richiesta di 0-.
    const compatible = await request(app)
      .get('/api/emergencies?bloodType=0&rh=negative&city=Salerno')
      .expect(200);
    expect(compatible.body.data).toHaveLength(1);

    // A+ non può donare a un ricevente 0-: nessuna emergenza compatibile.
    const incompatible = await request(app)
      .get('/api/emergencies?bloodType=A&rh=positive')
      .expect(200);
    expect(incompatible.body.data).toHaveLength(0);
  });

  it('computes donation eligibility', async () => {
    // Senza ultima donazione l'utente è sempre idoneo.
    const eligible = await request(app)
      .get('/api/donation-eligibility?type=Plasma&sex=M')
      .expect(200);
    expect(eligible.body.data.eligible).toBe(true);

    // Donazione "oggi": la prossima data utile è nel futuro, quindi non idoneo.
    const today = new Date().toISOString().slice(0, 10);
    const notEligible = await request(app)
      .get(`/api/donation-eligibility?type=Sangue intero&sex=F&lastDonationDate=${today}`)
      .expect(200);
    expect(notEligible.body.data.eligible).toBe(false);
    expect(notEligible.body.data.nextEligibleDate).not.toBeNull();

    await request(app).get('/api/donation-eligibility?type=Boh&sex=M').expect(400);
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown').expect(404);

    expect(response.body.error).toBe('Not found');
  });
});
