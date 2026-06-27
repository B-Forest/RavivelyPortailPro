import { api } from "../api";
import type { FieldExtractResponse, GlobalExtractResponse, VoiceProfileField } from "./types";

export class AIExtractionService {
  extractGlobal(transcription: string): Promise<GlobalExtractResponse> {
    return api.extractVoiceProfileGlobal(transcription);
  }

  extractField(transcription: string, field: VoiceProfileField): Promise<FieldExtractResponse> {
    return api.extractVoiceProfileField(transcription, field);
  }
}

export const aiExtractionService = new AIExtractionService();
