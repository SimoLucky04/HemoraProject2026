import type { Request, Response } from 'express';
import type { DonationType } from '@hemora/shared-types';
import {
  calculateEligibility,
  DONATION_TYPES,
  WAIT_DAYS,
} from '../services/eligibility.service';
import { asString } from '../utils/requestParsers';

function asDonationType(value: unknown): DonationType | undefined {
  const text = asString(value);
  return text && DONATION_TYPES.includes(text as DonationType) ? (text as DonationType) : undefined;
}

export const donationsController = {
  // Regole condivise con l'app (matrice WAIT_DAYS, ultima->prossima donazione).
  rules(_req: Request, res: Response) {
    res.json({ data: { types: DONATION_TYPES, waitDays: WAIT_DAYS } });
  },

  // Esempio: GET /api/donation-eligibility?type=Plasma&lastType=Sangue intero&lastDonationDate=2026-05-01
  eligibility(req: Request, res: Response) {
    const type = asDonationType(req.query.type);
    const lastType = asDonationType(req.query.lastType);
    const lastDonationDate = asString(req.query.lastDonationDate);

    if (!type) {
      res.status(400).json({ error: 'Parametro type non valido' });
      return;
    }
    if (req.query.lastType !== undefined && !lastType) {
      res.status(400).json({ error: 'Parametro lastType non valido' });
      return;
    }

    const result = calculateEligibility({ type, lastType, lastDonationDate });
    res.json({ data: result });
  },
};
