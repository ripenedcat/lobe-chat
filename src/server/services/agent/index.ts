import { LobeChatDatabase } from '@lobechat/database';

import { AiProviderModel } from '@/database/models/aiProvider';
import { SessionModel } from '@/database/models/session';
import { getServerDefaultAgentConfig } from '@/server/globalConfig';

export class AgentService {
  private readonly userId: string;
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }

  async createInbox() {
    const sessionModel = new SessionModel(this.db, this.userId);
    const defaultAgentConfig = getServerDefaultAgentConfig();
    await sessionModel.createInbox(defaultAgentConfig);
  }

  async createDefaultAssistants() {
    const sessionModel = new SessionModel(this.db, this.userId);
    const defaultAgentConfig = getServerDefaultAgentConfig();
    await sessionModel.createDefaultAssistants(defaultAgentConfig);
  }

  async updateDefaultAssistantsAvatars() {
    const sessionModel = new SessionModel(this.db, this.userId);
    await sessionModel.updateDefaultAssistantsAvatars();
  }

  async initializeGithubCopilotProvider() {
    try {
      const aiProviderModel = new AiProviderModel(this.db, this.userId);

      // Import KeyVaultsGateKeeper for encryption
      const { KeyVaultsGateKeeper } = await import('@/server/modules/KeyVaultsEncrypt');
      const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();

      // Check if GitHub Copilot provider already exists
      const existingProvider = await aiProviderModel.findById('githubcopilot');

      if (!existingProvider) {
        // Create GitHub Copilot provider with default API key
        await aiProviderModel.create(
          {
            id: 'githubcopilot',
            keyVaults: {
              apiKey: 'ABC123Dummy',
              baseURL: 'http://52.163.124.133:14141',
            },
            name: 'GitHub Copilot',
            source: 'builtin',
          },
          gateKeeper.encrypt,
        );
        console.log('[AgentService] Successfully created GitHub Copilot provider');
      } else {
        // Update existing provider to ensure keyVaults are properly encrypted
        await aiProviderModel.updateConfig(
          'githubcopilot',
          {
            keyVaults: {
              apiKey: 'ABC123Dummy',
              baseURL: 'http://52.163.124.133:14141',
            },
          },
          gateKeeper.encrypt,
        );
        console.log('[AgentService] Updated GitHub Copilot provider keyVaults');
      }
    } catch (error: any) {
      // Ignore duplicate key errors (23505) - provider already exists
      if (error?.cause?.code === '23505') {
        console.log('[AgentService] GitHub Copilot provider already exists (duplicate key)');
        return;
      }
      // Log other errors but don't throw - we don't want to break session loading
      console.error('[AgentService] Error initializing GitHub Copilot provider:', error);
    }
  }
}
