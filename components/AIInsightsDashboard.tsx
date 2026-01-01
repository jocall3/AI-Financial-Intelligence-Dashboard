import React, { useState, useCallback } from 'react';
import {
    useAIInsightManagement, InsightTypeIconMap, ExtendedAIInsight, AINotification,
    InsightPrioritizationRule, Agent, PaymentTransaction,
    TokenTransaction, DataSourceConfig
} from '../hooks/useAIInsightManagement';

const getUrgencyClass = (urgency: ExtendedAIInsight['urgency'] | AINotification['priority']) => {
    switch (urgency) {
        case 'critical': return 'bg-red-500 text-white';
        case 'high': return 'bg-orange-500 text-white';
        case 'medium': return 'bg-yellow-400 text-black';
        case 'low': return 'bg-green-400 text-black';
        case 'informational': return 'bg-blue-300 text-black';
        default: return 'bg-gray-300 text-black';
    }
};

const getStatusClass = (status: ExtendedAIInsight['status']) => {
    switch (status) {
        case 'active': return 'bg-blue-200 text-blue-800';
        case 'actioned': return 'bg-green-200 text-green-800';
        case 'resolved': return 'bg-emerald-200 text-emerald-800';
        case 'pending review': return 'bg-yellow-200 text-yellow-800';
        case 'dismissed': return 'bg-gray-200 text-gray-800';
        case 'archived': return 'bg-slate-200 text-slate-800';
        case 'reopened': return 'bg-red-200 text-red-800';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '800px', width: '90%',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
            }}>
                <h2 style={{ fontSize: '1.8em', marginBottom: '20px', color: '#333' }}>{title}</h2>
                <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>{children}</div>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        backgroundColor: '#eee', border: 'none', borderRadius: '50%',
                        width: '30px', height: '30px', cursor: 'pointer', fontSize: '1.2em',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export const AIInsightsDashboard = () => {
    const {
        aiInsights, isInsightsLoading, generateDashboardInsights, markInsightAsActioned,
        queryInput, setQueryInput, queryResults, isQuerying, submitAIQuery, clearQueryResults,
        preferences, handlePreferenceChange, handleSavePreferences, resetPreferences,
        availableInsightTypes, availableAIModels,
        provideInsightFeedback,
        aiSystemStatus, aiPerformanceMetrics, getAIModelDetails, checkSystemHealth,
        historicalSearchTerm, setHistoricalSearchTerm, historicalFilters, handleHistoricalFilterChange,
        historicalSearchResults, isHistoricalLoading, historicalTotalResults,
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
        agents, triggerAgentAction, setAgentStatus,
        payments, simulatePaymentRequest,
        tokenLedgerStatus, tokenTransactions, simulateTokenTransfer,
        auditEvents, currentUser, isSimulationMode,
        assignAgentSkill, removeAgentSkill,
    } = useAIInsightManagement();

    const [activeTab, setActiveTab] = useState('insights');
    const [isInsightDetailsModalOpen, setIsInsightDetailsModalOpen] = useState(false);
    const [selectedInsightForDisplay, setSelectedInsightForDisplay] = useState<ExtendedAIInsight | null>(null);
    const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
    const [isSystemHealthModalOpen, setIsSystemHealthModalOpen] = useState(false);
    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
    const [isModelDetailsModalOpen, setIsModelDetailsModalOpen] = useState(false);
    const [isDataSourceConfigModalOpen, setIsDataSourceConfigModalOpen] = useState(false);
    const [selectedDataSourceConfig, setSelectedDataSourceConfig] = useState<DataSourceConfig | null>(null);
    const [newRuleForm, setNewRuleForm] = useState<Partial<Omit<InsightPrioritizationRule, 'id' | 'lastModified'>>>({
        name: '', isActive: true, boostFactor: 1.2, criteria: {}
    });
    const [feedbackInput, setFeedbackInput] = useState({ rating: 5, comment: '' });
    const [isAgentDetailsModalOpen, setIsAgentDetailsModalOpen] = useState(false);
    const [selectedAgentForDisplay, setSelectedAgentForDisplay] = useState<Agent | null>(null);
    const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
    const [selectedPaymentForDisplay, setSelectedPaymentForDisplay] = useState<PaymentTransaction | null>(null);
    const [newTokenTransferForm, setNewTokenTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: 0, token: 'USD_TOKEN', rail: 'rail_fast' });
    const [newPaymentRequestForm, setNewPaymentRequestForm] = useState({ amount: 0, currency: 'USD', recipient: '', description: '' });
    const [newSkillInput, setNewSkillInput] = useState('');

    const openInsightDetails = useCallback((insight: ExtendedAIInsight) => {
        setSelectedInsightForDisplay(insight);
        setIsInsightDetailsModalOpen(true);
    }, []);

    const closeInsightDetails = useCallback(() => {
        setSelectedInsightForDisplay(null);
        setIsInsightDetailsModalOpen(false);
        setSelectedCollaborationInsightId(null);
    }, [setSelectedCollaborationInsightId]);

    const handleSubmitFeedback = useCallback((insightId: string) => {
        const userId = currentUser ? currentUser.id : (collaborationUsers.length > 0 ? collaborationUsers[0].id : 'simulated-user-1');
        const userName = currentUser ? currentUser.name : (collaborationUsers.length > 0 ? collaborationUsers[0].name : 'Simulated User');
        provideInsightFeedback(insightId, feedbackInput.rating, feedbackInput.comment);
        setFeedbackInput({ rating: 5, comment: '' });
        alert('Feedback submitted!');
    }, [provideInsightFeedback, feedbackInput, collaborationUsers, currentUser]);

    const handleSaveNewRule = useCallback(() => {
        if (newRuleForm.name && newRuleForm.boostFactor) {
            addPrioritizationRule(newRuleForm as Omit<InsightPrioritizationRule, 'id' | 'lastModified'>);
            setNewRuleForm({ name: '', isActive: true, boostFactor: 1.2, criteria: {} });
            setIsAddRuleModalOpen(false);
            alert('New prioritization rule added!');
        } else {
            alert('Rule name and boost factor are required.');
        }
    }, [newRuleForm, addPrioritizationRule]);

    const handleSaveDataSourceConfig = useCallback(async () => {
        if (selectedDataSourceConfig) {
            await updateDataSourceConfiguration(selectedDataSourceConfig.id, selectedDataSourceConfig);
            setIsDataSourceConfigModalOpen(false);
            alert('Data source configuration updated!');
        }
    }, [selectedDataSourceConfig, updateDataSourceConfiguration]);

    const handleMarkRecommendedActionComplete = useCallback((insightId: string, actionId: string) => {
        markInsightAsActioned(insightId, actionId);
        alert('Action marked as completed!');
        if (selectedInsightForDisplay?.id === insightId) {
            setSelectedInsightForDisplay(prev => prev ? {
                ...prev,
                recommendedActions: prev.recommendedActions?.map(action =>
                    action.id === actionId ? { ...action, status: 'completed' } : action
                )
            } : null);
        }
    }, [markInsightAsActioned, selectedInsightForDisplay]);

    const openAgentDetails = useCallback((agent: Agent) => {
        setSelectedAgentForDisplay(agent);
        setIsAgentDetailsModalOpen(true);
    }, []);

    const closeAgentDetails = useCallback(() => {
        setSelectedAgentForDisplay(null);
        setIsAgentDetailsModalOpen(false);
        setNewSkillInput('');
    }, []);

    const handleTriggerAgentAction = useCallback(async (agentId: string, actionType: string, payload: any) => {
        try {
            await triggerAgentAction(agentId, actionType, payload);
            alert(`Action '${actionType}' triggered for agent ${agentId}.`);
        } catch (error: any) {
            alert(`Failed to trigger action: ${error.message}`);
        }
    }, [triggerAgentAction]);

    const handleSetAgentStatus = useCallback(async (agentId: string, status: 'active' | 'idle' | 'suspended') => {
        try {
            await setAgentStatus(agentId, status);
            alert(`Agent ${agentId} status updated to ${status}.`);
        } catch (error: any) {
            alert(`Failed to update agent status: ${error.message}`);
        }
    }, [setAgentStatus]);

    const openPaymentDetails = useCallback((payment: PaymentTransaction) => {
        setSelectedPaymentForDisplay(payment);
        setIsPaymentDetailsModalOpen(true);
    }, []);

    const closePaymentDetails = useCallback(() => {
        setSelectedPaymentForDisplay(null);
        setIsPaymentDetailsModalOpen(false);
    }, []);

    const handleSimulateTokenTransfer = useCallback(async () => {
        if (!newTokenTransferForm.fromAccountId || !newTokenTransferForm.toAccountId || newTokenTransferForm.amount <= 0) {
            alert('Please fill all token transfer fields correctly.');
            return;
        }
        try {
            await simulateTokenTransfer(
                newTokenTransferForm.fromAccountId,
                newTokenTransferForm.toAccountId,
                newTokenTransferForm.amount,
                newTokenTransferForm.token,
                newTokenTransferForm.rail
            );
            alert('Token transfer simulation initiated!');
            setNewTokenTransferForm({ fromAccountId: '', toAccountId: '', amount: 0, token: 'USD_TOKEN', rail: 'rail_fast' });
        } catch (error: any) {
            alert(`Token transfer failed: ${error.message}`);
        }
    }, [newTokenTransferForm, simulateTokenTransfer]);

    const handleSimulatePaymentRequest = useCallback(async () => {
        if (!newPaymentRequestForm.recipient || newPaymentRequestForm.amount <= 0) {
            alert('Please fill all payment request fields correctly.');
            return;
        }
        try {
            await simulatePaymentRequest(
                newPaymentRequestForm.amount,
                newPaymentRequestForm.currency,
                newPaymentRequestForm.recipient,
                newPaymentRequestForm.description
            );
            alert('Payment request simulation initiated!');
            setNewPaymentRequestForm({ amount: 0, currency: 'USD', recipient: '', description: '' });
        } catch (error: any) {
            alert(`Payment request failed: ${error.message}`);
        }
    }, [newPaymentRequestForm, simulatePaymentRequest]);

    const handleAssignAgentSkill = useCallback(async (agentId: string) => {
        if (!newSkillInput.trim()) {
            alert("Skill name cannot be empty.");
            return;
        }
        try {
            await assignAgentSkill(agentId, { id: Date.now().toString(), name: newSkillInput, description: `Dynamic skill: ${newSkillInput}` });
            alert(`Skill '${newSkillInput}' assigned to agent ${agentId}.`);
            setNewSkillInput('');
            setSelectedAgentForDisplay(prev => prev ? {
                ...prev,
                skills: [...(prev.skills || []), { id: Date.now().toString(), name: newSkillInput, description: `Dynamic skill: ${newSkillInput}` }]
            } : null);
        } catch (error: any) {
            alert(`Failed to assign skill: ${error.message}`);
        }
    }, [assignAgentSkill, newSkillInput]);

    const handleRemoveAgentSkill = useCallback(async (agentId: string, skillId: string) => {
        try {
            await removeAgentSkill(agentId, skillId);
            alert(`Skill removed from agent ${agentId}.`);
            setSelectedAgentForDisplay(prev => prev ? {
                ...prev,
                skills: prev.skills?.filter(skill => skill.id !== skillId)
            } : null);
        } catch (error: any) {
            alert(`Failed to remove skill: ${error.message}`);
        }
    }, [removeAgentSkill]);

    const InsightCard: React.FC<{ insight: ExtendedAIInsight }> = ({ insight }) => (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '280px' }}>
            <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getUrgencyClass(insight.urgency)}`}>
                    {insight.urgency.toUpperCase()}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(insight.status || 'active')}`}>
                    {insight.status ? insight.status.replace('-', ' ').toUpperCase() : 'ACTIVE'}
                </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                {InsightTypeIconMap[insight.type]} {insight.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">
                {insight.description}
            </p>
            <div className="mt-auto flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                <button
                    onClick={() => openInsightDetails(insight)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    View Details
                </button>
            </div>
        </div>
    );

    const NotificationItem: React.FC<{ notification: AINotification }> = ({ notification }) => (
        <div className={`bg-white rounded-lg shadow p-4 mb-3 flex items-start ${!notification.isRead ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-200'}`}>
            <div className="flex-grow">
                <p className="font-semibold text-gray-800">{notification.message}</p>
                <p className="text-sm text-gray-500 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getUrgencyClass(notification.priority)} mr-2`}>
                        {notification.priority.toUpperCase()}
                    </span>
                    {new Date(notification.timestamp).toLocaleString()}
                </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
                {!notification.isRead && (
                    <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        title="Mark as Read"
                    >
                        Read
                    </button>
                )}
                <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                    title="Dismiss Notification"
                >
                    Dismiss
                </button>
                {notification.link && (
                    <a href={notification.link} className="text-gray-600 hover:text-gray-900 text-sm font-medium" title="Go to Insight">
                        Go
                    </a>
                )}
            </div>
        </div>
    );

    const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '220px' }}>
            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{agent.name}</h3>
            <p className="text-sm text-gray-600 mb-2 flex-grow">{agent.description}</p>
            <div className="flex justify-between items-center text-sm mb-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${agent.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {agent.status.toUpperCase()}
                </span>
                <span className="text-gray-500">Last Active: {new Date(agent.lastActive).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Roles: {agent.roles.join(', ')}</p>
            <div className="mt-auto flex justify-end space-x-3">
                <button
                    onClick={() => openAgentDetails(agent)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                    Details
                </button>
                <button
                    onClick={() => handleSetAgentStatus(agent.id, agent.status === 'active' ? 'suspended' : 'active')}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${agent.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                    {agent.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
            </div>
        </div>
    );

    const PaymentCard: React.FC<{ payment: PaymentTransaction }> = ({ payment }) => (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ minHeight: '180px' }}>
            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">Payment: {payment.id.substring(0, 8)}...</h3>
            <p className="text-sm text-gray-600 mb-2">Amount: <span className="font-semibold">{payment.amount} {payment.currency}</span></p>
            <p className="text-sm text-gray-600 mb-2">Recipient: <span className="font-semibold">{payment.recipient}</span></p>
            <div className="flex justify-between items-center text-sm mb-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${payment.status === 'settled' ? 'bg-green-200 text-green-800' : payment.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                    {payment.status.toUpperCase()}
                </span>
                <span className="text-gray-500">Rail: {payment.railUsed}</span>
            </div>
            {payment.fraudScore && payment.fraudScore > 0.5 && (
                <p className="text-xs text-red-600 mt-1 font-semibold">Fraud Risk: HIGH ({payment.fraudScore.toFixed(2)})</p>
            )}
            <div className="mt-auto flex justify-end">
                <button
                    onClick={() => openPaymentDetails(payment)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                    Details
                </button>
            </div>
        </div>
    );

    const TokenTransactionItem: React.FC<{ tx: TokenTransaction }> = ({ tx }) => (
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-3">
            <p className="text-sm font-semibold text-gray-800">
                {tx.type.toUpperCase()}: <span className="font-normal text-blue-700">{tx.transactionId.substring(0, 10)}...</span>
            </p>
            {tx.fromAccountId && <p className="text-xs text-gray-600 mt-1">From: {tx.fromAccountId.substring(0, 15)}...</p>}
            {tx.toAccountId && <p className="text-xs text-gray-600">To: {tx.toAccountId.substring(0, 15)}...</p>}
            <p className="text-sm text-gray-700 mt-1">
                Amount: <span className="font-bold">{tx.amount} {tx.token}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
                Rail: {tx.rail} | Timestamp: {new Date(tx.timestamp).toLocaleString()}
            </p>
            {tx.status === 'failed' && (
                <p className="text-xs text-red-600 mt-1 font-semibold">Status: Failed - {tx.errorMessage}</p>
            )}
            {tx.signature && <p className="text-xs text-gray-500 truncate mt-1">Signature: {tx.signature}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-blue-700 leading-tight mb-4">
                    AI-Driven Financial Intelligence Dashboard
                </h1>
                <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-6">
                    This dashboard is your command center for intelligent operations, bridging agentic AI with robust financial infrastructure. Gain real-time insights, manage autonomous agents, oversee tokenized transactions, and ensure digital identity security.
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => setIsPreferencesModalOpen(true)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors duration-200 shadow-md"
                    >
                        Configure AI Preferences
                    </button>
                    <button
                        onClick={() => setIsSystemHealthModalOpen(true)}
                        className="bg-teal-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-teal-700 transition-colors duration-200 shadow-md"
                    >
                        Monitor System Health
                    </button>
                    {isSimulationMode && (
                        <span className="bg-orange-500 text-white px-4 py-2 rounded-lg text-lg font-semibold flex items-center">
                            SIMULATION MODE ACTIVE
                        </span>
                    )}
                </div>
            </header>

            <nav className="mb-8 bg-white p-3 rounded-lg shadow-sm flex flex-wrap justify-center space-x-2 sm:space-x-4">
                {['insights', 'query', 'historical', 'collaboration', 'prioritization', 'models', 'notifications', 'data-sources', 'operations'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-md text-lg font-medium transition-colors duration-200 ${
                            activeTab === tab
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                        {tab === 'notifications' && unreadNotificationCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                                {unreadNotificationCount}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="dashboard-content bg-white p-8 rounded-lg shadow-xl">
                {activeTab === 'insights' && (
                    <section className="section-dashboard-summary">
                        <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">
                            Actionable Insights: Your Strategic Advantage
                        </h2>
                        <div className="text-center mb-8">
                            <button
                                onClick={generateDashboardInsights}
                                disabled={isInsightsLoading}
                                className="bg-gradient-to-r from-green-500 to-green-700 text-white px-8 py-4 rounded-full text-xl font-bold hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50"
                            >
                                {isInsightsLoading ? "Generating Insights..." : "Generate Fresh Insights"}
                            </button>
                        </div>
                        {isInsightsLoading && <p className="text-center text-blue-600 text-lg mt-4">AI is processing data for new insights...</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {aiInsights.length > 0 ? (
                                aiInsights.map(insight => <InsightCard key={insight.id} insight={insight} />)
                            ) : (
                                !isInsightsLoading && (
                                    <p className="col-span-full text-center text-gray-600 text-lg py-10">
                                        No active insights. Generate new ones to refresh your perspective.
                                    </p>
                                )
                            )}
                        </div>
                    </section>
                )}
                
                {activeTab === 'query' && (
                    <section className="section-ai-query">
                        <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">
                            Dynamic AI Query
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <input
                                type="text"
                                value={queryInput}
                                onChange={(e) => setQueryInput(e.target.value)}
                                placeholder="e.g., 'What's the predicted impact of recent supply chain disruptions?'"
                                className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                                disabled={isQuerying}
                            />
                            <button
                                onClick={() => submitAIQuery(queryInput)}
                                disabled={isQuerying || !queryInput.trim()}
                                className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:opacity-50"
                            >
                                {isQuerying ? "AI Processing..." : "Get AI Answer"}
                            </button>
                            <button
                                onClick={clearQueryResults}
                                className="bg-gray-400 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-500 transition-colors duration-200 shadow-md"
                            >
                                Clear Results
                            </button>
                        </div>
                        {queryResults.length > 0 && (
                            <div className="bg-gray-100 p-6 rounded-lg shadow-inner mt-6">
                                <h3 className="text-2xl font-semibold text-gray-700 mb-4">AI Response:</h3>
                                {queryResults.map((result, index) => (
                                    <p key={index} className="text-gray-800 mb-3 leading-relaxed border-l-4 border-blue-400 pl-4 py-2">
                                        {result}
                                    </p>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'operations' && (
                    <section className="section-operations-hub">
                        <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">
                            Financial Operations Hub
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
                                <h3 className="text-2xl font-semibold text-gray-700 mb-4">Autonomous AI Agent Management</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {agents.length > 0 ? (
                                        agents.map(agent => <AgentCard key={agent.id} agent={agent} />)
                                    ) : (
                                        <p className="col-span-full text-gray-600">No active AI agents found.</p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
                                <h3 className="text-2xl font-semibold text-gray-700 mb-4">Token Rail & Ledger</h3>
                                <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                                    <h4 className="font-bold text-blue-800 text-lg mb-2">Ledger Overview:</h4>
                                    <p className="text-gray-700 text-sm">Total Tokens: <span className="font-semibold">{tokenLedgerStatus.totalTokens.toLocaleString()} USD_TOKEN</span></p>
                                    <p className="text-gray-700 text-sm">Last Block: <span className="font-mono text-xs">{tokenLedgerStatus.lastBlockId}</span></p>
                                </div>
                                <h4 className="font-bold text-gray-700 text-xl mb-3">Recent Transactions:</h4>
                                <div className="max-h-80 overflow-y-auto pr-2">
                                    {tokenTransactions.map(tx => <TokenTransactionItem key={tx.transactionId} tx={tx} />)}
                                </div>
                                {isSimulationMode && (
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <h4 className="font-semibold text-yellow-800 mb-3">Simulate Token Transfer:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <input
                                                type="text" placeholder="From ID" value={newTokenTransferForm.fromAccountId}
                                                onChange={(e) => setNewTokenTransferForm(prev => ({ ...prev, fromAccountId: e.target.value }))}
                                                className="p-2 border rounded-md"
                                            />
                                            <input
                                                type="text" placeholder="To ID" value={newTokenTransferForm.toAccountId}
                                                onChange={(e) => setNewTokenTransferForm(prev => ({ ...prev, toAccountId: e.target.value }))}
                                                className="p-2 border rounded-md"
                                            />
                                            <input
                                                type="number" placeholder="Amount" value={newTokenTransferForm.amount}
                                                onChange={(e) => setNewTokenTransferForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                className="p-2 border rounded-md"
                                            />
                                        </div>
                                        <button onClick={handleSimulateTokenTransfer} className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 w-full">Transfer</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'models' && (
                    <section>
                         <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">AI Model Governance</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {availableAIModels.map(model => (
                                <div key={model.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{model.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                                    <div className="flex justify-between items-center text-sm mb-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${model.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                            {model.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button onClick={() => { setSelectedAIModelForDetails(model.id); setIsModelDetailsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Details</button>
                                        <button onClick={() => deployAIModel(model.id)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">Deploy</button>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </section>
                )}

                 {activeTab === 'notifications' && (
                    <section>
                         <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">Notifications</h2>
                         <div className="flex justify-center mb-8">
                            <button onClick={markAllNotificationsAsRead} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">Mark All as Read</button>
                         </div>
                         <div className="max-w-3xl mx-auto">
                            {notifications.length > 0 ? (
                                notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                            ) : <p className="text-center text-gray-600">No new notifications.</p>}
                         </div>
                    </section>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isInsightDetailsModalOpen} onClose={closeInsightDetails} title={`Insight: ${selectedInsightForDisplay?.title}`}>
                {selectedInsightForDisplay && (
                    <div className="space-y-4">
                        <p>{selectedInsightForDisplay.description}</p>
                        {selectedInsightForDisplay.explanation && <div className="bg-blue-50 p-3 rounded"><h4 className="font-bold">AI Explanation:</h4><p>{selectedInsightForDisplay.explanation}</p></div>}
                        <h4 className="font-bold mt-4">Recommended Actions:</h4>
                        <ul className="list-disc pl-5">
                            {selectedInsightForDisplay.recommendedActions?.map(act => (
                                <li key={act.id} className="mb-2">
                                    {act.description}
                                    {act.status !== 'completed' && <button onClick={() => handleMarkRecommendedActionComplete(selectedInsightForDisplay.id, act.id)} className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Done</button>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isPreferencesModalOpen} onClose={() => setIsPreferencesModalOpen(false)} title="AI Preferences">
                <div className="space-y-4">
                    <label className="block">Refresh Interval (mins):
                        <input type="number" value={preferences.refreshIntervalMinutes} onChange={handlePreferenceChange} className="border p-2 rounded w-full" />
                    </label>
                    <button onClick={handleSavePreferences} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                </div>
            </Modal>

            <Modal isOpen={isAgentDetailsModalOpen} onClose={closeAgentDetails} title="Agent Details">
                {selectedAgentForDisplay && (
                    <div>
                        <h3 className="font-bold text-xl">{selectedAgentForDisplay.name}</h3>
                        <p>{selectedAgentForDisplay.description}</p>
                        <div className="mt-4">
                            <h4 className="font-bold">Actions</h4>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleTriggerAgentAction(selectedAgentForDisplay.id, 'audit', {})} className="bg-orange-500 text-white px-3 py-1 rounded">Trigger Audit</button>
                                <button onClick={() => handleSetAgentStatus(selectedAgentForDisplay.id, 'suspended')} className="bg-red-500 text-white px-3 py-1 rounded">Suspend</button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isPaymentDetailsModalOpen} onClose={closePaymentDetails} title="Payment Details">
                {selectedPaymentForDisplay && (
                    <div>
                        <p><strong>ID:</strong> {selectedPaymentForDisplay.id}</p>
                        <p><strong>Amount:</strong> {selectedPaymentForDisplay.amount} {selectedPaymentForDisplay.currency}</p>
                        <p><strong>Status:</strong> {selectedPaymentForDisplay.status}</p>
                        {selectedPaymentForDisplay.fraudScore && <p className="text-red-600"><strong>Fraud Score:</strong> {selectedPaymentForDisplay.fraudScore}</p>}
                    </div>
                )}
            </Modal>

            <Modal isOpen={isSystemHealthModalOpen} onClose={() => setIsSystemHealthModalOpen(false)} title="System Health">
                <div>
                    <p>Status: {aiSystemStatus}</p>
                    <p>Insight Rate: {aiPerformanceMetrics.insightGenerationRate.toFixed(2)} / min</p>
                    <button onClick={checkSystemHealth} className="mt-4 bg-blue-500 text-white px-3 py-1 rounded">Refresh</button>
                </div>
            </Modal>
            
            <Modal isOpen={isModelDetailsModalOpen} onClose={() => setIsModelDetailsModalOpen(false)} title="Model Details">
                {selectedAIModelForDetails && (
                    <div>
                        <p>Model ID: {selectedAIModelForDetails}</p>
                        <p>Performance: {JSON.stringify(getAIModelDetails(selectedAIModelForDetails)?.performanceMetrics)}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AIInsightsDashboard;