import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as registrationService from '../services/registration.service';
import * as campService from '../services/camp.service';
import * as hackathonService from '../services/hackathon.service';
import prisma from '../config/db';

// Helper — map year number to YearTarget enum
const yearToTarget = (year: number): string => {
  const map: Record<number, string> = {
    1: 'FIRST',
    2: 'SECOND',
    3: 'THIRD',
    4: 'FOURTH',
  };
  return map[year] || 'ALL';
};

// POST /api/registrations/camp/:campId
export const registerForCamp = async (req: Request, res: Response) => {
  try {
    const campId = req.params.campId as string;
    const user = req.user as unknown as JwtPayload;

    // 1. Check profile is complete
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !dbUser.isProfileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before registering',
      });
    }

    // 2. Check camp exists
    const camp = await campService.getCampById(campId);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    // 3. Check year eligibility
    if (camp.yearTarget !== 'ALL' && camp.yearTarget !== yearToTarget(dbUser.year)) {
      return res.status(403).json({
        success: false,
        message: 'This camp is not open for your year',
      });
    }

    // 4. Check already registered
    const existing = await registrationService.getCampRegistration(user.userId, campId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this camp',
      });
    }

    // 5. Check seats available
    if (camp.maxSeats) {
      const count = await registrationService.getCampRegistrationCount(campId);
      if (count >= camp.maxSeats) {
        return res.status(400).json({ success: false, message: 'Camp is full' });
      }
    }

    const registration = await registrationService.registerForCamp(user.userId, campId);
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    console.error('Register for camp error:', error);
    res.status(500).json({ success: false, message: 'Failed to register' });
  }
};

// POST /api/registrations/hackathon/:hackathonId
export const registerForHackathon = async (req: Request, res: Response) => {
  try {
    const hackathonId = req.params.hackathonId as string;
    const user = req.user as unknown as JwtPayload;

    // 1. Check profile is complete
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !dbUser.isProfileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before registering',
      });
    }

    // 2. Check hackathon exists
    const hackathon = await hackathonService.getHackathonPublic(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    // 3. Check deadline hasn't passed
    if (new Date() > new Date(hackathon.regDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed',
      });
    }

    // 4. Check already registered
    const existing = await registrationService.getHackathonRegistration(user.userId, hackathonId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this hackathon',
      });
    }

    const registration = await registrationService.registerForHackathon(user.userId, hackathonId);
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    console.error('Register for hackathon error:', error);
    res.status(500).json({ success: false, message: 'Failed to register' });
  }
};

// GET /api/registrations/my
export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const user = req.user as unknown as JwtPayload;
    const registrations = await registrationService.getMyRegistrations(user.userId);
    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
};