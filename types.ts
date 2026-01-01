export interface UserProfile {
    id: string;
    name: string;
    roles: string[];
    publicKey: string;
}

export interface AgentSkill {
    id: string;
    name: string;
    description: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'idle' | 'suspended';
    lastActive: string; // ISO Date
    roles: string[];
    type: string;
    publicKey: string;
    skills?: AgentSkill[];
}

export interface PaymentTransaction {
    id: string;
    amount: number;
    currency: string;
    recipient: string;
    sender: string;
    status: 'settled' | 'pending' | 'failed';
    railUsed: string;
    timestamp: string;
    fraudScore?: number;
    fraudReasons?: string[];
    description?: string;
    routingDecision?: {
        chosenRail: string;
        predictedLatencyMs: number;
        costEstimate: string;
    };
}

export interface TokenTransaction {
    transactionId: string;
    type: 'mint' | 'burn' | 'transfer';
    fromAccountId?: string;
    toAccountId?: string;
    amount: number;
    token: string;
    rail: string;
    timestamp: string;
    status: 'success' | 'failed' | 'pending';
    errorMessage?: string;
    signature?: string;
}

export interface AuditEvent {
    id: string;
    action: string;
    userId: string;
    targetId: string;
    timestamp: string;
    details?: any;
    eventHash: string;
}

export interface TokenLedgerStatus {
    totalTokens: number;
    lastBlockId: string;
}

export interface DataSourceConfig {
    id: string;
    name: string;
    description: string;
    refreshIntervalMinutes: number;
    type: string;
    status: 'connected' | 'error' | 'syncing';
    lastSync: string;
}

export interface AINotification {
    id: string;
    message: string;
    priority: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    timestamp: string;
    isRead: boolean;
    link?: string;
}

export interface InsightPrioritizationRule {
    id: string;
    name: string;
    isActive: boolean;
    boostFactor: number;
    lastModified?: string;
    criteria: {
        type?: string[];
        urgency?: ('critical' | 'high' | 'medium' | 'low' | 'informational')[];
        minImpactScore?: number;
    };
}

export interface AIPerformanceMetrics {
    lastHeartbeat: string;
    insightGenerationRate: number;
    averageResponseTime: number;
    dataProcessingVolume: number;
    resourceUtilization: {
        cpu: number;
        memory: number;
        gpu?: number;
    };
}

export interface AIModel {
    id: string;
    name: string;
    version: string;
    description: string;
    status: 'active' | 'training' | 'deprecated';
    lastUpdated: string;
    deploymentDate: string;
    performanceMetrics?: {
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
    };
    trainingDataInfo?: {
        sizeGB: number;
        lastRefresh: string;
        biasDetected: boolean;
    };
}

export interface Comment {
    id: string;
    userName: string;
    text: string;
    timestamp: string;
}

export interface RecommendedAction {
    id: string;
    description: string;
    status: 'pending' | 'completed';
    assignedTo?: string;
}

export interface ExtendedAIInsight {
    id: string;
    title: string;
    description: string;
    urgency: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    status: 'active' | 'actioned' | 'resolved' | 'pending review' | 'dismissed' | 'archived' | 'reopened';
    type: 'risk' | 'opportunity' | 'operational' | 'fraud' | 'compliance';
    timestamp: string;
    source: string;
    explanation?: string;
    recommendedActions?: RecommendedAction[];
    comments?: Comment[];
    assignedTo?: UserProfile[];
    impactScore?: number;
    priorityScore?: number;
}
