import { useState, useEffect, useCallback } from 'react';
import { 
    ExtendedAIInsight, AIModel, AIPerformanceMetrics, DataSourceConfig, 
    AINotification, InsightPrioritizationRule, Agent, PaymentTransaction, 
    TokenTransaction, AuditEvent, UserProfile, TokenLedgerStatus, AgentSkill,
    RecommendedAction
} from '../types';
import { generateInsightsFromData, queryGemini } from '../services/geminiService';

// Export types for use in component
export * from '../types';

export const InsightTypeIconMap: Record<string, string> = {
    risk: '⚠️',
    opportunity: '🚀',
    operational: '⚙️',
    fraud: '🛡️',
    compliance: '📜'
};

const MOCK_AGENTS: Agent[] = [
    { id: 'agent-001', name: 'Sentinel Alpha', description: 'Real-time fraud detection and anomaly scanning.', status: 'active', lastActive: new Date().toISOString(), roles: ['Security', 'Audit'], type: 'Watcher', publicKey: '0x7e...3f9a' },
    { id: 'agent-002', name: 'Ledger Keeper', description: 'Automated reconciliation of token rails.', status: 'active', lastActive: new Date().toISOString(), roles: ['Accounting'], type: 'Reconciler', publicKey: '0x2a...8b1c' },
    { id: 'agent-003', name: 'Route Optimizer', description: 'Predictive payment routing for lowest latency.', status: 'idle', lastActive: new Date(Date.now() - 3600000).toISOString(), roles: ['Operations'], type: 'Optimizer', publicKey: '0x9c...1d4e' },
];

const MOCK_PAYMENTS: PaymentTransaction[] = [
    { id: 'pay-tx-9821', amount: 4500.00, currency: 'USD', recipient: 'Supplier Corp A', sender: 'Enterprise Main', status: 'settled', railUsed: 'RTP', timestamp: new Date(Date.now() - 100000).toISOString(), fraudScore: 0.12, routingDecision: { chosenRail: 'RTP', predictedLatencyMs: 450, costEstimate: '$0.25' } },
    { id: 'pay-tx-9822', amount: 125000.00, currency: 'EUR', recipient: 'Global Logistics Ltd', sender: 'Enterprise EU', status: 'pending', railUsed: 'SWIFT gpi', timestamp: new Date().toISOString(), fraudScore: 0.05, routingDecision: { chosenRail: 'SWIFT gpi', predictedLatencyMs: 12000, costEstimate: '$12.00' } },
];

const MOCK_INSIGHTS: ExtendedAIInsight[] = [
    {
        id: 'ins-1',
        title: 'Unusual Transaction Volume Detected',
        description: 'Spike in high-value transactions on the APAC rail detected in the last hour.',
        urgency: 'high',
        status: 'active',
        type: 'risk',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        source: 'Sentinel Alpha',
        explanation: 'Volume exceeds 30-day moving average by 400%.',
        recommendedActions: [
            { id: 'act-1', description: 'Review APAC liquidity pool', status: 'pending' },
            { id: 'act-2', description: 'Trigger manual audit for top 5 transactions', status: 'pending' }
        ],
        comments: []
    },
    {
        id: 'ins-2',
        title: 'Liquidity Optimization Opportunity',
        description: 'Excess idle liquidity found in USD_TOKEN treasury. Recommend deploying to yield protocol.',
        urgency: 'medium',
        status: 'active',
        type: 'opportunity',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'Ledger Keeper',
        explanation: 'Treasury utilization is below 15% efficiency threshold.',
        recommendedActions: [
            { id: 'act-3', description: 'Move 2M USD_TOKEN to Yield Vault', status: 'pending' }
        ]
    }
];

export const useAIInsightManagement = () => {
    // State
    const [aiInsights, setAiInsights] = useState<ExtendedAIInsight[]>(MOCK_INSIGHTS);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [queryInput, setQueryInput] = useState('');
    const [queryResults, setQueryResults] = useState<string[]>([]);
    const [isQuerying, setIsQuerying] = useState(false);
    
    // Preferences & Config
    const [preferences, setPreferences] = useState({
        insightTypes: ['risk', 'opportunity'],
        urgencyThreshold: 'medium',
        modelSelection: 'gemini-pro',
        notificationSettings: { email: true, push: true, sms: false, threshold: 'high' },
        refreshIntervalMinutes: 5
    });
    
    // System Data
    const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
    const [payments, setPayments] = useState<PaymentTransaction[]>(MOCK_PAYMENTS);
    const [tokenLedgerStatus, setTokenLedgerStatus] = useState<TokenLedgerStatus>({ totalTokens: 50000000, lastBlockId: '0x8f2...a1b' });
    const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const [notifications, setNotifications] = useState<AINotification[]>([]);
    const [dataSourcesConfig, setDataSourcesConfig] = useState<DataSourceConfig[]>([
        { id: 'ds-1', name: 'Core Ledger', description: 'Main transaction ledger', refreshIntervalMinutes: 1, type: 'blockchain', status: 'connected', lastSync: new Date().toISOString() },
        { id: 'ds-2', name: 'Market Feeds', description: 'External FX and Crypto prices', refreshIntervalMinutes: 5, type: 'api', status: 'connected', lastSync: new Date().toISOString() }
    ]);
    const [isDataSourceLoading, setIsDataSourceLoading] = useState(false);
    
    // UI State
    const [isSimulationMode, setIsSimulationMode] = useState(true);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(2);
    const [currentUser, setCurrentUser] = useState<UserProfile>({ id: 'u-123', name: 'Admin User', roles: ['Admin', 'Operator'], publicKey: '0x...' });
    
    // Collaboration
    const [collaborationUsers] = useState<UserProfile[]>([
        { id: 'u-123', name: 'Admin User', roles: ['Admin'], publicKey: '0x...' },
        { id: 'u-456', name: 'Sarah Ops', roles: ['Analyst'], publicKey: '0x...' },
        { id: 'u-789', name: 'Mike Sec', roles: ['Security'], publicKey: '0x...' }
    ]);
    const [selectedCollaborationInsightId, setSelectedCollaborationInsightId] = useState<string | null>(null);
    const [newCommentText, setNewCommentText] = useState('');
    const [assignedUserForCollaboration, setAssignedUserForCollaboration] = useState('');
    const [assignActionToUser, setAssignActionToUser] = useState<{ actionId: string, userId: string } | null>(null);

    // Historical & Models
    const [historicalSearchTerm, setHistoricalSearchTerm] = useState('');
    const [historicalFilters, setHistoricalFilters] = useState<any>({ type: 'all', urgency: 'all', status: 'all', startDate: '', endDate: '' });
    const [historicalSearchResults, setHistoricalSearchResults] = useState<ExtendedAIInsight[]>([]);
    const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
    const [historicalTotalResults, setHistoricalTotalResults] = useState(0);
    const [historicalCurrentPage, setHistoricalCurrentPage] = useState(1);
    const [historicalPageSize, setHistoricalPageSize] = useState(10);
    const [historicalSortBy, setHistoricalSortBy] = useState('timestamp');
    const [historicalSortOrder, setHistoricalSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const [prioritizationRules, setPrioritizationRules] = useState<InsightPrioritizationRule[]>([]);
    const [availableAIModels] = useState<AIModel[]>([
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', version: '3.0', description: 'High speed reasoning model', status: 'active', lastUpdated: '2025-05-15', deploymentDate: '2025-01-01', performanceMetrics: { accuracy: 0.98, precision: 0.97, recall: 0.99, f1_score: 0.98 } },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', version: '3.0', description: 'Complex reasoning model', status: 'active', lastUpdated: '2025-05-20', deploymentDate: '2025-02-01', performanceMetrics: { accuracy: 0.99, precision: 0.99, recall: 0.98, f1_score: 0.985 } }
    ]);
    const [selectedAIModelForDetails, setSelectedAIModelForDetails] = useState<string | null>(null);
    const [isModelTesting, setIsModelTesting] = useState(false);
    const [modelComparisonResults, setModelComparisonResults] = useState<any[]>([]);

    const [aiPerformanceMetrics, setAiPerformanceMetrics] = useState<AIPerformanceMetrics>({
        lastHeartbeat: new Date().toISOString(),
        insightGenerationRate: 12.5,
        averageResponseTime: 450,
        dataProcessingVolume: 15.4,
        resourceUtilization: { cpu: 45, memory: 60, gpu: 30 }
    });
    const [aiSystemStatus, setAiSystemStatus] = useState('operational');

    // Actions
    const generateDashboardInsights = async () => {
        setIsInsightsLoading(true);
        const systemSnapshot = {
            agentsStatus: agents.map(a => ({ name: a.name, status: a.status })),
            pendingPaymentsCount: payments.filter(p => p.status === 'pending').length,
            ledgerTotal: tokenLedgerStatus.totalTokens,
            recentEvents: auditEvents.slice(0, 5)
        };

        const generated: any[] = await generateInsightsFromData(systemSnapshot);
        
        const newInsights: ExtendedAIInsight[] = generated.map((g, i) => ({
            id: `gen-${Date.now()}-${i}`,
            title: g.title,
            description: g.description,
            urgency: (g.urgency as any) || 'medium',
            status: 'active',
            type: (g.type as any) || 'operational',
            timestamp: new Date().toISOString(),
            source: 'Gemini AI',
            explanation: g.explanation,
            recommendedActions: g.recommendedActions?.map((act: string, idx: number) => ({
                id: `act-${Date.now()}-${idx}`,
                description: act,
                status: 'pending'
            })) || []
        }));

        if (newInsights.length > 0) {
            setAiInsights(prev => [...newInsights, ...prev]);
            setNotifications(prev => [{
                id: `notif-${Date.now()}`,
                message: `AI generated ${newInsights.length} new insights.`,
                priority: 'informational',
                timestamp: new Date().toISOString(),
                isRead: false
            }, ...prev]);
            setUnreadNotificationCount(prev => prev + 1);
        }
        setIsInsightsLoading(false);
    };

    const submitAIQuery = async (query: string) => {
        setIsQuerying(true);
        const context = `
            Active Agents: ${agents.length}. 
            Total Tokens: ${tokenLedgerStatus.totalTokens}. 
            Recent Critical Insights: ${aiInsights.filter(i => i.urgency === 'critical').length}.
        `;
        const result = await queryGemini(query, context);
        setQueryResults(prev => [result, ...prev]);
        setIsQuerying(false);
    };

    const clearQueryResults = () => setQueryResults([]);

    const dismissInsight = (id: string) => {
        setAiInsights(prev => prev.map(i => i.id === id ? { ...i, status: 'dismissed' } : i));
    };

    const markInsightAsActioned = (insightId: string, actionId: string) => {
        setAiInsights(prev => prev.map(i => {
            if (i.id !== insightId) return i;
            return {
                ...i,
                recommendedActions: i.recommendedActions?.map(a => 
                    a.id === actionId ? { ...a, status: 'completed' } : a
                )
            };
        }));
    };

    const updateInsightStatus = (id: string, status: ExtendedAIInsight['status']) => {
        setAiInsights(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    };

    // Agent Management
    const triggerAgentAction = async (agentId: string, action: string, payload: any) => {
        // Mock async action
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                setAuditEvents(prev => [{
                    id: `evt-${Date.now()}`,
                    action: `Agent Action: ${action}`,
                    userId: currentUser.id,
                    targetId: agentId,
                    timestamp: new Date().toISOString(),
                    eventHash: '0x' + Math.random().toString(16).slice(2)
                }, ...prev]);
                resolve();
            }, 1000);
        });
    };

    const setAgentStatus = async (agentId: string, status: 'active' | 'idle' | 'suspended') => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status } : a));
    };

    const getAgentDetails = (id: string) => agents.find(a => a.id === id);

    const assignAgentSkill = async (agentId: string, skill: AgentSkill) => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, skills: [...(a.skills || []), skill] } : a));
    };

    const removeAgentSkill = async (agentId: string, skillId: string) => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, skills: a.skills?.filter(s => s.id !== skillId) } : a));
    };

    // Payment Simulation
    const simulatePaymentRequest = async (amount: number, currency: string, recipient: string, description: string) => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const newPayment: PaymentTransaction = {
                    id: `pay-${Date.now()}`,
                    amount,
                    currency,
                    recipient,
                    sender: 'Self',
                    status: Math.random() > 0.1 ? 'settled' : 'pending',
                    railUsed: 'SimulatedRail',
                    timestamp: new Date().toISOString(),
                    fraudScore: Math.random() * 0.2,
                    description,
                    routingDecision: { chosenRail: 'SimulatedRail', predictedLatencyMs: 200, costEstimate: '$0.05' }
                };
                setPayments(prev => [newPayment, ...prev]);
                resolve();
            }, 800);
        });
    };

    const simulateTokenTransfer = async (from: string, to: string, amount: number, token: string, rail: string) => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const newTx: TokenTransaction = {
                    transactionId: `tx-${Date.now()}`,
                    type: 'transfer',
                    fromAccountId: from,
                    toAccountId: to,
                    amount,
                    token,
                    rail,
                    timestamp: new Date().toISOString(),
                    status: 'success'
                };
                setTokenTransactions(prev => [newTx, ...prev]);
                setTokenLedgerStatus(prev => ({ ...prev, lastBlockId: '0x' + Math.random().toString(16).slice(2) }));
                resolve();
            }, 600);
        });
    };

    // Misc
    const getPaymentDetails = (id: string) => payments.find(p => p.id === id);
    const getAIModelDetails = (id: string) => availableAIModels.find(m => m.id === id);
    const checkSystemHealth = () => {
        setAiPerformanceMetrics(prev => ({
            ...prev,
            lastHeartbeat: new Date().toISOString(),
            insightGenerationRate: Math.random() * 20 + 5
        }));
    };
    
    // Historical Mocking
    const handleHistoricalSearch = () => {
        setIsHistoricalLoading(true);
        setTimeout(() => {
            setHistoricalSearchResults(MOCK_INSIGHTS); // Just returning mock for now
            setHistoricalTotalResults(MOCK_INSIGHTS.length);
            setIsHistoricalLoading(false);
        }, 500);
    };

    useEffect(() => {
        handleHistoricalSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historicalSearchTerm, historicalFilters, historicalSortBy, historicalSortOrder]);

    const handlePreferenceChange = (e: any) => {
        // Implementation simplified for brevity
    };
    const handleSavePreferences = () => alert("Preferences Saved");
    const resetPreferences = () => {};

    // Collaboration
    const handleAddComment = () => {
        if (!selectedCollaborationInsightId || !newCommentText.trim()) return;
        setAiInsights(prev => prev.map(i => {
            if (i.id !== selectedCollaborationInsightId) return i;
            return {
                ...i,
                comments: [...(i.comments || []), {
                    id: `c-${Date.now()}`,
                    userName: currentUser.name,
                    text: newCommentText,
                    timestamp: new Date().toISOString()
                }]
            };
        }));
        setNewCommentText('');
    };
    
    const handleAssignInsight = () => {
        if (!selectedCollaborationInsightId || !assignedUserForCollaboration) return;
        const user = collaborationUsers.find(u => u.id === assignedUserForCollaboration);
        if (!user) return;
        setAiInsights(prev => prev.map(i => {
            if (i.id !== selectedCollaborationInsightId) return i;
            return {
                ...i,
                assignedTo: [...(i.assignedTo || []), user]
            };
        }));
        setAssignedUserForCollaboration('');
    };

    const assignActionToUserInInsight = (insightId: string, actionId: string, userId: string) => {
        // simplified logic
        alert(`Assigned action ${actionId} to user ${userId}`);
    };

    const provideInsightFeedback = (id: string, rating: number, comment: string) => {};
    const addInsightAttachment = () => {};
    const addPrioritizationRule = (rule: any) => setPrioritizationRules(prev => [...prev, { ...rule, id: `rule-${Date.now()}` }]);
    const updatePrioritizationRule = (id: string, updates: any) => setPrioritizationRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    const deletePrioritizationRule = (id: string) => setPrioritizationRules(prev => prev.filter(r => r.id !== id));
    const recalculateAllInsightPriorities = () => alert("Priorities Recalculated");
    const deployAIModel = (id: string) => alert(`Model ${id} deployed`);
    const compareAIModels = (ids: string[]) => {
        setIsModelTesting(true);
        setTimeout(() => {
            setModelComparisonResults(ids.map(id => ({
                modelId: id,
                insightsGenerated: Math.floor(Math.random() * 1000),
                avgAccuracy: 0.9 + Math.random() * 0.09
            })));
            setIsModelTesting(false);
        }, 1500);
    };

    const markNotificationAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    };
    const markAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadNotificationCount(0);
    };
    const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
    const fetchDataSourceStatus = (id: string) => alert("Status: OK");
    const updateDataSourceConfiguration = async (id: string, config: any) => setDataSourcesConfig(prev => prev.map(d => d.id === id ? config : d));
    const triggerManualSync = (id: string) => alert("Sync Triggered");
    const handleHistoricalFilterChange = (e: any) => {
        const { name, value } = e.target;
        setHistoricalFilters((prev: any) => ({ ...prev, [name]: value }));
    };
    const handleHistoricalSortChange = (by: string, order: 'asc' | 'desc') => {
        setHistoricalSortBy(by);
        setHistoricalSortOrder(order);
    };

    return {
        aiInsights, isInsightsLoading, generateDashboardInsights, dismissInsight, markInsightAsActioned,
        updateInsightStatus, addInsightAttachment,
        queryInput, setQueryInput, queryResults, isQuerying, submitAIQuery, clearQueryResults,
        preferences, handlePreferenceChange, handleSavePreferences, resetPreferences,
        availableInsightTypes: ['risk', 'opportunity', 'operational', 'fraud', 'compliance'],
        availableDataSources: [], availableAIModels,
        provideInsightFeedback,
        aiSystemStatus, aiPerformanceMetrics, getAIModelDetails, checkSystemHealth,
        historicalSearchTerm, setHistoricalSearchTerm, historicalFilters, setHistoricalFilters, handleHistoricalFilterChange,
        handleHistoricalSearch, historicalSearchResults, isHistoricalLoading, historicalTotalResults,
        historicalCurrentPage, setHistoricalCurrentPage, historicalPageSize, setHistoricalPageSize,
        historicalSortBy, historicalSortOrder, handleHistoricalSortChange,
        selectedCollaborationInsightId, setSelectedCollaborationInsightId, newCommentText, setNewCommentText,
        assignedUserForCollaboration, setAssignedUserForCollaboration, assignActionToUser, setAssignActionToUser,
        collaborationUsers, handleAddComment, handleAssignInsight, assignActionToUserInInsight,
        prioritizationRules, addPrioritizationRule, updatePrioritizationRule, deletePrioritizationRule,
        recalculateAllInsightPriorities,
        selectedAIModelForDetails, setSelectedAIModelForDetails, isModelTesting, deployAIModel,
        compareAIModels, modelComparisonResults,
        notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, dismissNotification,
        dataSourcesConfig, isDataSourceLoading, fetchDataSourceStatus, updateDataSourceConfiguration, triggerManualSync,
        agents, getAgentDetails, triggerAgentAction, setAgentStatus,
        payments, getPaymentDetails, simulatePaymentRequest,
        tokenLedgerStatus, tokenTransactions, simulateTokenTransfer,
        auditEvents, currentUser, isSimulationMode,
        assignAgentSkill, removeAgentSkill
    };
};