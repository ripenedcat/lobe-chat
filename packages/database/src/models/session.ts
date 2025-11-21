import { DEFAULT_AGENT_CONFIG, DEFAULT_INBOX_AVATAR, INBOX_SESSION_ID } from '@lobechat/const';
import {
  ChatSessionList,
  LobeAgentConfig,
  LobeAgentSession,
  LobeGroupSession,
  SessionRankItem,
} from '@lobechat/types';
import {
  Column,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  like,
  not,
  or,
  sql,
} from 'drizzle-orm';
import type { PartialDeep } from 'type-fest';

import { merge } from '@/utils/merge';

import {
  AgentItem,
  NewAgent,
  NewSession,
  SessionItem,
  agents,
  agentsToSessions,
  sessionGroups,
  sessions,
  topics,
} from '../schemas';
import { LobeChatDatabase } from '../type';
import { genEndDateWhere, genRangeWhere, genStartDateWhere, genWhere } from '../utils/genWhere';
import { idGenerator } from '../utils/idGenerator';

export class SessionModel {
  private userId: string;
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }
  // **************** Query *************** //

  query = async ({ current = 0, pageSize = 9999 } = {}) => {
    const offset = current * pageSize;

    return this.db.query.sessions.findMany({
      limit: pageSize,
      offset,
      orderBy: [desc(sessions.updatedAt)],
      where: and(eq(sessions.userId, this.userId), not(eq(sessions.slug, INBOX_SESSION_ID))),
      with: { agentsToSessions: { columns: {}, with: { agent: true } }, group: true },
    });
  };

  queryWithGroups = async (): Promise<ChatSessionList> => {
    // 查询所有会话
    const result = await this.query();

    const groups = await this.db.query.sessionGroups.findMany({
      orderBy: [asc(sessionGroups.sort), desc(sessionGroups.createdAt)],
      where: eq(sessions.userId, this.userId),
    });

    return {
      sessionGroups: groups as unknown as ChatSessionList['sessionGroups'],
      sessions: result.map((item) => this.mapSessionItem(item as any)),
    };
  };

  queryByKeyword = async (keyword: string) => {
    if (!keyword) return [];

    const keywordLowerCase = keyword.toLowerCase();

    const data = await this.findSessionsByKeywords({ keyword: keywordLowerCase });

    return data.map((item) => this.mapSessionItem(item as any));
  };

  findByIdOrSlug = async (
    idOrSlug: string,
  ): Promise<(SessionItem & { agent: AgentItem }) | undefined> => {
    const result = await this.db.query.sessions.findFirst({
      where: and(
        or(eq(sessions.id, idOrSlug), eq(sessions.slug, idOrSlug)),
        eq(sessions.userId, this.userId),
      ),
      with: { agentsToSessions: { columns: {}, with: { agent: true } }, group: true },
    });

    if (!result) return;

    return { ...result, agent: (result?.agentsToSessions?.[0] as any)?.agent } as any;
  };

  count = async (params?: {
    endDate?: string;
    range?: [string, string];
    startDate?: string;
  }): Promise<number> => {
    const result = await this.db
      .select({
        count: count(sessions.id),
      })
      .from(sessions)
      .where(
        genWhere([
          eq(sessions.userId, this.userId),
          params?.range
            ? genRangeWhere(params.range, sessions.createdAt, (date) => date.toDate())
            : undefined,
          params?.endDate
            ? genEndDateWhere(params.endDate, sessions.createdAt, (date) => date.toDate())
            : undefined,
          params?.startDate
            ? genStartDateWhere(params.startDate, sessions.createdAt, (date) => date.toDate())
            : undefined,
        ]),
      );

    return result[0].count;
  };

  _rank = async (limit: number = 10): Promise<SessionRankItem[]> => {
    return this.db
      .select({
        avatar: agents.avatar,
        backgroundColor: agents.backgroundColor,
        count: count(topics.id).as('count'),
        id: sessions.id,
        title: agents.title,
      })
      .from(sessions)
      .where(and(eq(sessions.userId, this.userId)))
      .leftJoin(topics, eq(sessions.id, topics.sessionId))
      .leftJoin(agentsToSessions, eq(sessions.id, agentsToSessions.sessionId))
      .leftJoin(agents, eq(agentsToSessions.agentId, agents.id))
      .groupBy(sessions.id, agentsToSessions.agentId, agents.id)
      .having(({ count }) => gt(count, 0))
      .orderBy(desc(sql`count`))
      .limit(limit);
  };

  // TODO: 未来将 Inbox id 入库后可以直接使用 _rank 方法
  rank = async (limit: number = 10): Promise<SessionRankItem[]> => {
    const inboxResult = await this.db
      .select({
        count: count(topics.id).as('count'),
      })
      .from(topics)
      .where(and(eq(topics.userId, this.userId), isNull(topics.sessionId)));

    const inboxCount = inboxResult[0].count;

    if (!inboxCount || inboxCount === 0) return this._rank(limit);

    const result = await this._rank(limit ? limit - 1 : undefined);

    return [
      {
        avatar: DEFAULT_INBOX_AVATAR,
        backgroundColor: null,
        count: inboxCount,
        id: INBOX_SESSION_ID,
        title: 'inbox.title',
      },
      ...result,
    ].sort((a, b) => b.count - a.count);
  };

  hasMoreThanN = async (n: number): Promise<boolean> => {
    const result = await this.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, this.userId))
      .limit(n + 1);

    return result.length > n;
  };

  // **************** Create *************** //

  create = async ({
    id = idGenerator('sessions'),
    type = 'agent',
    session = {},
    config = {},
    slug,
  }: {
    config?: Partial<NewAgent>;
    id?: string;
    session?: Partial<NewSession>;
    slug?: string;
    type: 'agent' | 'group';
  }): Promise<SessionItem> => {
    return this.db.transaction(async (trx) => {
      if (slug) {
        const existResult = await trx.query.sessions.findFirst({
          where: and(eq(sessions.slug, slug), eq(sessions.userId, this.userId)),
        });

        if (existResult) return existResult;
      }

      if (type === 'group') {
        const result = await trx
          .insert(sessions)
          .values({
            ...session,
            createdAt: new Date(),
            id,
            slug,
            type,
            updatedAt: new Date(),
            userId: this.userId,
          })
          .returning();

        return result[0];
      }

      const newAgents = await trx
        .insert(agents)
        .values({
          ...config,
          createdAt: new Date(),
          id: idGenerator('agents'),
          updatedAt: new Date(),
          userId: this.userId,
        })
        .returning();

      const result = await trx
        .insert(sessions)
        .values({
          ...session,
          createdAt: new Date(),
          id,
          slug,
          type,
          updatedAt: new Date(),
          userId: this.userId,
        })
        .returning();

      await trx.insert(agentsToSessions).values({
        agentId: newAgents[0].id,
        sessionId: id,
        userId: this.userId,
      });

      return result[0];
    });
  };

  createInbox = async (defaultAgentConfig: PartialDeep<LobeAgentConfig>) => {
    const item = await this.db.query.sessions.findFirst({
      where: and(eq(sessions.userId, this.userId), eq(sessions.slug, INBOX_SESSION_ID)),
    });

    if (item) return;

    return await this.create({
      config: merge(DEFAULT_AGENT_CONFIG, defaultAgentConfig, {
        checkpointWeek: 'Checkpoint Week1',
        collection: 'azure_monitor',
      }),
      slug: INBOX_SESSION_ID,
      type: 'agent',
    });
  };

  createDefaultAssistants = async (
    defaultAgentConfig: PartialDeep<LobeAgentConfig>,
    envAgentConfigs?: {
      checkpointAgent?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
      qaAgent?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
      readinessPlanAgent?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
    },
  ) => {
    const DEFAULT_ASSISTANTS = [
      {
        config: {
          avatar: '😀',
          params: envAgentConfigs?.readinessPlanAgent?.params,
          systemRole:
            envAgentConfigs?.readinessPlanAgent?.systemRole ||
            'You are a Readiness Plan Agent. Your role is to help users create comprehensive readiness plans.',
        },
        slug: 'readiness-plan-agent',
        title: 'Readiness Plan Agent',
      },
      {
        config: {
          avatar: '😆',
          params: envAgentConfigs?.checkpointAgent?.params,
          systemRole:
            envAgentConfigs?.checkpointAgent?.systemRole ||
            'You are a Checkpoint Agent. Your role is to help users track progress and verify completion of tasks.',
        },
        slug: 'checkpoint-agent',
        title: 'Checkpoint Agent',
      },
      {
        config: {
          avatar: '😉',
          params: envAgentConfigs?.qaAgent?.params,
          systemRole:
            envAgentConfigs?.qaAgent?.systemRole ||
            'You are a QA Agent. Your role is to help users with quality assurance and testing.',
        },
        slug: 'qa-agent',
        title: 'QA Agent',
      },
    ];

    const createdSessions = [];

    for (const assistant of DEFAULT_ASSISTANTS) {
      try {
        const existingItem = await this.db.query.sessions.findFirst({
          where: and(eq(sessions.userId, this.userId), eq(sessions.slug, assistant.slug)),
        });

        if (!existingItem) {
          const session = await this.create({
            config: merge(DEFAULT_AGENT_CONFIG, defaultAgentConfig, assistant.config, {
              checkpointWeek: 'Checkpoint Week1',
              collection: 'azure_monitor',
            }),
            session: {
              title: assistant.title,
            },
            slug: assistant.slug,
            type: 'agent',
          });
          createdSessions.push(session);
        }
      } catch (error: any) {
        // Ignore duplicate key errors (code 23505) - this means the assistant already exists
        // This can happen due to race conditions when multiple requests try to create at the same time
        if (error?.cause?.code !== '23505') {
          // Re-throw if it's not a duplicate key error
          throw error;
        }
        // If it's a duplicate key error, just continue to the next assistant
      }
    }

    return createdSessions;
  };

  updateDefaultAssistantsAvatars = async () => {
    const AVATAR_MAPPINGS: Record<string, string> = {
      'checkpoint-agent': '😆',
      'qa-agent': '😉',
      'readiness-plan-agent': '😀',
    };

    console.log('[updateDefaultAssistantsAvatars] Starting avatar updates for user:', this.userId);

    for (const [slug, avatar] of Object.entries(AVATAR_MAPPINGS)) {
      try {
        const session = await this.db.query.sessions.findFirst({
          where: and(eq(sessions.userId, this.userId), eq(sessions.slug, slug)),
          with: {
            agentsToSessions: {
              with: {
                agent: true,
              },
            },
          },
        });

        if (!session) {
          console.log(`[updateDefaultAssistantsAvatars] Session not found for slug: ${slug}`);
          continue;
        }

        console.log(
          `[updateDefaultAssistantsAvatars] Found session for ${slug}, ID: ${session.id}`,
        );

        const agent = session.agentsToSessions?.[0]?.agent;
        if (!agent) {
          console.log(`[updateDefaultAssistantsAvatars] No agent found for session ${slug}`);
          continue;
        }

        console.log(`[updateDefaultAssistantsAvatars] Current avatar for ${slug}:`, agent.avatar);
        console.log(`[updateDefaultAssistantsAvatars] Updating to:`, avatar);

        await this.updateConfig(session.id, { avatar });
        console.log(`[updateDefaultAssistantsAvatars] Successfully updated avatar for ${slug}`);
      } catch (error) {
        console.error(
          `[updateDefaultAssistantsAvatars] Failed to update avatar for ${slug}:`,
          error,
        );
      }
    }

    console.log('[updateDefaultAssistantsAvatars] Finished avatar updates');
  };

  updateDefaultAssistantsConfig = async (envAgentConfigs?: {
    checkpointAgent?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
    qaAgent?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
    readinessPlanAgent?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
  }) => {
    if (!envAgentConfigs) {
      console.log('[updateDefaultAssistantsConfig] No env configs provided, skipping update');
      return;
    }

    const CONFIG_MAPPINGS: Array<{
      config?: { params?: Partial<LobeAgentConfig['params']>; systemRole?: string };
      slug: string;
    }> = [
      {
        config: envAgentConfigs.readinessPlanAgent,
        slug: 'readiness-plan-agent',
      },
      {
        config: envAgentConfigs.checkpointAgent,
        slug: 'checkpoint-agent',
      },
      {
        config: envAgentConfigs.qaAgent,
        slug: 'qa-agent',
      },
    ];

    console.log('[updateDefaultAssistantsConfig] Starting config updates for user:', this.userId);

    for (const { slug, config } of CONFIG_MAPPINGS) {
      if (!config) {
        console.log(`[updateDefaultAssistantsConfig] No config for ${slug}, skipping`);
        continue;
      }

      try {
        const session = await this.db.query.sessions.findFirst({
          where: and(eq(sessions.userId, this.userId), eq(sessions.slug, slug)),
          with: {
            agentsToSessions: {
              with: {
                agent: true,
              },
            },
          },
        });

        if (!session) {
          console.log(`[updateDefaultAssistantsConfig] Session not found for slug: ${slug}`);
          continue;
        }

        const agent = session.agentsToSessions?.[0]?.agent;
        if (!agent) {
          console.log(`[updateDefaultAssistantsConfig] No agent found for session ${slug}`);
          continue;
        }

        const updatePayload: PartialDeep<LobeAgentConfig> = {};

        if (config.systemRole) {
          updatePayload.systemRole = config.systemRole;
          console.log(`[updateDefaultAssistantsConfig] Updating systemRole for ${slug}`);
        }

        if (config.params) {
          // Merge with existing params to ensure all params are included
          const existingParams = (agent.params as LobeAgentConfig['params']) || {};
          updatePayload.params = {
            frequency_penalty: config.params.frequency_penalty ?? existingParams.frequency_penalty,
            presence_penalty: config.params.presence_penalty ?? existingParams.presence_penalty,
            temperature: config.params.temperature ?? existingParams.temperature,
            top_p: config.params.top_p ?? existingParams.top_p,
          };
          console.log(
            `[updateDefaultAssistantsConfig] Updating params for ${slug}:`,
            updatePayload.params,
          );
        }

        if (Object.keys(updatePayload).length > 0) {
          console.log(
            `[updateDefaultAssistantsConfig] About to update ${slug} with payload:`,
            JSON.stringify(updatePayload, null, 2),
          );
          console.log(`[updateDefaultAssistantsConfig] Current agent params:`, agent.params);
          console.log(
            `[updateDefaultAssistantsConfig] Current agent systemRole:`,
            agent.systemRole,
          );

          await this.updateConfig(session.id, updatePayload);

          // Verify the update
          const updatedSession = await this.findByIdOrSlug(session.id);
          console.log(
            `[updateDefaultAssistantsConfig] After update - params:`,
            updatedSession?.agent?.params,
          );
          console.log(
            `[updateDefaultAssistantsConfig] After update - systemRole:`,
            updatedSession?.agent?.systemRole,
          );

          console.log(`[updateDefaultAssistantsConfig] Successfully updated config for ${slug}`);
        }
      } catch (error) {
        console.error(
          `[updateDefaultAssistantsConfig] Failed to update config for ${slug}:`,
          error,
        );
      }
    }

    console.log('[updateDefaultAssistantsConfig] Finished config updates');
  };

  batchCreate = async (newSessions: NewSession[]) => {
    const sessionsToInsert = newSessions.map((s) => {
      return {
        ...s,
        id: this.genId(),
        userId: this.userId,
      };
    });

    return this.db.insert(sessions).values(sessionsToInsert);
  };

  duplicate = async (id: string, newTitle?: string) => {
    const result = await this.findByIdOrSlug(id);

    if (!result) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,unused-imports/no-unused-vars
    const { agent, clientId, ...session } = result;
    const sessionId = this.genId();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, slug: __, ...config } = agent;

    return this.create({
      config: config,
      id: sessionId,
      session: {
        ...session,
        title: newTitle || session.title,
      },
      type: 'agent',
    });
  };

  // **************** Delete *************** //

  /**
   * Delete a session and its associated agent data if no longer referenced.
   */
  delete = async (id: string) => {
    return this.db.transaction(async (trx) => {
      // First get the agent IDs associated with this session
      const links = await trx
        .select({ agentId: agentsToSessions.agentId })
        .from(agentsToSessions)
        .where(and(eq(agentsToSessions.sessionId, id), eq(agentsToSessions.userId, this.userId)));

      const agentIds = links.map((link) => link.agentId);

      // Delete links in agentsToSessions
      await trx
        .delete(agentsToSessions)
        .where(and(eq(agentsToSessions.sessionId, id), eq(agentsToSessions.userId, this.userId)));

      // Delete the session
      const result = await trx
        .delete(sessions)
        .where(and(eq(sessions.id, id), eq(sessions.userId, this.userId)));

      // Delete orphaned agents
      await this.clearOrphanAgent(agentIds, trx);

      return result;
    });
  };

  /**
   * Batch delete sessions and their associated agent data if no longer referenced.
   */
  batchDelete = async (ids: string[]) => {
    if (ids.length === 0) return { count: 0 };

    return this.db.transaction(async (trx) => {
      // Get agent IDs associated with these sessions
      const links = await trx
        .select({ agentId: agentsToSessions.agentId })
        .from(agentsToSessions)
        .where(
          and(inArray(agentsToSessions.sessionId, ids), eq(agentsToSessions.userId, this.userId)),
        );

      const agentIds = [...new Set(links.map((link) => link.agentId))];

      // Delete links in agentsToSessions
      await trx
        .delete(agentsToSessions)
        .where(
          and(inArray(agentsToSessions.sessionId, ids), eq(agentsToSessions.userId, this.userId)),
        );

      // Delete the sessions
      const result = await trx
        .delete(sessions)
        .where(and(inArray(sessions.id, ids), eq(sessions.userId, this.userId)));

      // Delete orphaned agents
      await this.clearOrphanAgent(agentIds, trx);

      return result;
    });
  };

  /**
   * Delete all sessions and their associated agent data for this user.
   */
  deleteAll = async () => {
    return this.db.transaction(async (trx) => {
      // Delete all agentsToSessions for this user
      await trx.delete(agentsToSessions).where(eq(agentsToSessions.userId, this.userId));

      // Delete all agents that were only used by this user's sessions
      await trx.delete(agents).where(eq(agents.userId, this.userId));

      // Delete all sessions for this user
      return trx.delete(sessions).where(eq(sessions.userId, this.userId));
    });
  };

  clearOrphanAgent = async (agentIds: string[], trx: any) => {
    // Delete orphaned agents (those not linked to any other sessions)
    for (const agentId of agentIds) {
      const remaining = await trx
        .select()
        .from(agentsToSessions)
        .where(eq(agentsToSessions.agentId, agentId))
        .limit(1);

      if (remaining.length === 0) {
        await trx.delete(agents).where(and(eq(agents.id, agentId), eq(agents.userId, this.userId)));
      }
    }
  };

  // **************** Update *************** //

  update = async (id: string, data: Partial<SessionItem>) => {
    return this.db
      .update(sessions)
      .set(data)
      .where(and(eq(sessions.id, id), eq(sessions.userId, this.userId)))
      .returning();
  };

  updateConfig = async (sessionId: string, data: PartialDeep<AgentItem> | undefined | null) => {
    if (!data || Object.keys(data).length === 0) return;

    const session = await this.findByIdOrSlug(sessionId);
    if (!session) return;

    if (!session.agent) {
      throw new Error(
        'this session is not assign with agent, please contact with admin to fix this issue.',
      );
    }

    // 先处理参数字段：undefined 表示删除，null 表示禁用标记
    const existingParams = session.agent.params ?? {};
    const updatedParams: Record<string, any> = { ...existingParams };

    if (data.params) {
      const incomingParams = data.params as Record<string, any>;
      Object.keys(incomingParams).forEach((key) => {
        const incomingValue = incomingParams[key];

        // undefined 代表显式删除该字段
        if (incomingValue === undefined) {
          delete updatedParams[key];
          return;
        }

        // 其余值（包括 null）都直接覆盖，null 表示在前端禁用该参数
        updatedParams[key] = incomingValue;
      });
    }

    // 构建要合并的数据，排除 params（单独处理）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { params: _params, ...restData } = data;
    const mergedValue = merge(session.agent, restData);

    // 应用处理后的参数
    mergedValue.params = Object.keys(updatedParams).length > 0 ? updatedParams : undefined;

    // 最终清理：确保没有 undefined 或 null 值进入数据库
    if (mergedValue.params) {
      const params = mergedValue.params as Record<string, any>;
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      if (Object.keys(params).length === 0) {
        mergedValue.params = undefined;
      }
    }

    return this.db
      .update(agents)
      .set(mergedValue)
      .where(and(eq(agents.id, session.agent.id), eq(agents.userId, this.userId)));
  };

  // **************** Helper *************** //

  private genId = () => idGenerator('sessions');

  private mapSessionItem = ({
    agentsToSessions,
    title,
    backgroundColor,
    description,
    avatar,
    groupId,
    type,
    ...res
  }: SessionItem & { agentsToSessions?: { agent: AgentItem }[] }):
    | LobeAgentSession
    | LobeGroupSession => {
    const meta = {
      avatar: avatar ?? undefined,
      backgroundColor: backgroundColor ?? undefined,
      description: description ?? undefined,
      tags: undefined,
      title: title ?? undefined,
    };

    if (type === 'group') {
      // For group sessions, return without agent-specific fields
      // Transform agentsToSessions to include both relationship and agent data
      const members =
        agentsToSessions?.map((item, index) => {
          const member = {
            // Start with agent properties for compatibility
            ...item.agent,
            // Override with ChatGroupAgentItem properties
            agentId: item.agent.id,
            chatGroupId: res.id,
            enabled: true,
            order: index,
            role: 'participant',
            // Keep agent timestamps for now (could be overridden if needed)
          };
          return member;
        }) || [];

      return {
        ...res,
        group: groupId,
        members,
        meta,
        type: 'group',
      } as LobeGroupSession;
    }

    // For agent sessions, include agent-specific fields
    // TODO: 未来这里需要更好的实现方案，目前只取第一个
    const agent = agentsToSessions?.[0]?.agent;
    return {
      ...res,
      config: agent ? (agent as any) : { model: '', plugins: [] }, // Ensure config exists for agent sessions
      group: groupId,
      meta: {
        avatar: agent?.avatar ?? avatar ?? undefined,
        backgroundColor: agent?.backgroundColor ?? backgroundColor ?? undefined,
        description: agent?.description ?? description ?? undefined,
        tags: agent?.tags ?? undefined,
        title: agent?.title ?? title ?? undefined,
      },
      model: agent?.model || '',
      type: 'agent',
    } as LobeAgentSession;
  };

  findSessionsByKeywords = async (params: {
    current?: number;
    keyword: string;
    pageSize?: number;
  }) => {
    const { keyword, pageSize = 9999, current = 0 } = params;
    const offset = current * pageSize;

    try {
      const results = await this.db.query.agents.findMany({
        limit: pageSize,
        offset,
        orderBy: [desc(agents.updatedAt)],
        where: and(
          eq(agents.userId, this.userId),
          or(
            like(sql`lower(${agents.title})` as unknown as Column, `%${keyword.toLowerCase()}%`),
            like(
              sql`lower(${agents.description})` as unknown as Column,
              `%${keyword.toLowerCase()}%`,
            ),
          ),
        ),
        with: { agentsToSessions: { columns: {}, with: { session: true } } },
      });

      // 过滤和映射结果，确保有有效的 session 关联
      return (
        results
          .filter((item) => item.agentsToSessions && item.agentsToSessions.length > 0)
          // @ts-expect-error
          .map((item) => item.agentsToSessions[0].session)
          .filter((session) => session !== null && session !== undefined)
      );
    } catch (e) {
      console.error('findSessionsByKeywords error:', e, { keyword });
      return [];
    }
  };
}
