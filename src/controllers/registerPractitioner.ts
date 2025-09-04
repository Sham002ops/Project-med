import type { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MedplumClient } from '@medplum/core';


const medplum = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL || "https://api.medplum.com",
  clientId: process.env.MEDPLUM_CLIENT_ID!,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET!,
});





export const registerPractitioner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      // Required fields
      firstName,
      lastName,
      email,
      password,
      
      // Professional qualification (recommended)
      qualificationCode, // e.g., "MD", "RN", "PharmD"
      qualificationDisplay, // e.g., "Doctor of Medicine"
      licenseNumber,
      issuingOrganization, // Medical board/institution
      
      // Optional but recommended fields
      phone,
      gender, // "male" | "female" | "other" | "unknown"
      birthDate, // YYYY-MM-DD format
      
      // Address information
      addressLine,
      city,
      state,
      postalCode,
      country = "US",
      
      // Professional details
      npiNumber, // National Provider Identifier (US)
      specialties = [], // Array of specialty codes
      languages = [], // Languages spoken
      
      // Organization/Employment details
      organizationName,
      
    } = req.body;

    // Comprehensive validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: "Required fields missing: firstName, lastName, email, password" 
      });
    }

    if (!qualificationCode || !qualificationDisplay) {
      return res.status(400).json({ 
        error: "Professional qualification required: qualificationCode and qualificationDisplay" 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters" 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Invalid email format" 
      });
    }

    // Hash password for local storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build comprehensive Practitioner resource
    const practitionerData: any = {
      resourceType: "Practitioner",
      
      // Name information
      name: [
        {
          use: "official",
          family: lastName,
          given: [firstName]
        }
      ],
      
      // Contact information
      telecom: [
        {
          system: "email",
          value: email,
          use: "work"
        }
      ],
      
      // Professional qualifications
      qualification: [
        {
          code: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0360",
                code: qualificationCode,
                display: qualificationDisplay
              }
            ]
          },
          ...(licenseNumber && {
            identifier: [
              {
                use: "official",
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                value: licenseNumber
              }
            ]
          }),
          ...(issuingOrganization && {
            issuer: {
              display: issuingOrganization
            }
          })
        }
      ],
      
      // Active status
      active: true
    };

    // Add optional phone number
    if (phone) {
      practitionerData.telecom.push({
        system: "phone",
        value: phone,
        use: "work"
      });
    }

    // Add gender if provided
    if (gender) {
      practitionerData.gender = gender;
    }

    // Add birth date if provided
    if (birthDate) {
      practitionerData.birthDate = birthDate;
    }

    // Add address if provided
    if (addressLine || city || state || postalCode) {
      practitionerData.address = [
        {
          use: "work",
          type: "physical",
          ...(addressLine && { line: [addressLine] }),
          ...(city && { city }),
          ...(state && { state }),
          ...(postalCode && { postalCode }),
          ...(country && { country })
        }
      ];
    }

    // Add NPI identifier (US specific)
    if (npiNumber) {
      practitionerData.identifier = [
        {
          use: "official",
          system: "http://hl7.org/fhir/sid/us-npi",
          value: npiNumber
        }
      ];
    }

    // Add communication languages
    if (languages && languages.length > 0) {
    practitionerData.communication = (languages as string[]).map((lang: string): { language: { coding: { system: string; code: string }[] } } => ({
      language: {
        coding: [
          {
            system: "urn:ietf:bcp:47",
            code: lang // e.g., "en-US", "es", "fr"
          }
        ]
      }
    }));
    }

    // Create Practitioner in Medplum
    const practitioner = await medplum.createResource(practitionerData);

    // Optionally save to local database
    // await User.create({
    //   email,
    //   password: hashedPassword,
    //   medplumId: practitioner.id,
    //   role: 'practitioner',
    //   firstName,
    //   lastName
    // });

    // Generate JWT token
    const token = jwt.sign(
      {
        email,
        firstName,
        lastName,
        practitionerId: practitioner.id,
        role: 'practitioner',
        qualifications: qualificationCode
      },
      process.env.JWT_SECRET || "med_adherence_is_awesome",
      { expiresIn: "24h" }
    );

    // Return success response
    res.status(201).json({
      user: {
        firstName,
        lastName,
        email,
        practitionerId: practitioner.id,
        role: 'practitioner',
        qualifications: qualificationDisplay,
        npiNumber: npiNumber || null,
        specialties,
        organizationName: organizationName || null
      },
      accessToken: token,
      message: "Practitioner registered successfully"
    });

  } catch (err) {
    console.error('Practitioner registration error:', err);
    next(err);
  }
}
