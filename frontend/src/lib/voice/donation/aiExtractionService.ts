import { api } from "../../api";
import type { DonationFormVoiceState, DonationVoiceField } from "./types";
import { formToApiContext } from "./validationService";

export class AIExtractionService {
  extractGlobal(transcription: string, currentForm: DonationFormVoiceState) {
    return api.extractVoiceDonationGlobal(transcription, formToApiContext(currentForm));
  }

  extractField(transcription: string, field: DonationVoiceField, currentForm: DonationFormVoiceState) {
    return api.extractVoiceDonationField(transcription, field, formToApiContext(currentForm));
  }
}

export const donationAIExtractionService = new AIExtractionService();
