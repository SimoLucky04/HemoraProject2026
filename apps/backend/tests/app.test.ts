import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { demoCenters, demoEmergencyAlerts, MemoryStore } from '../src/data/memoryStore';

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

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown').expect(404);

    expect(response.body.error).toBe('Not found');
  });
});
