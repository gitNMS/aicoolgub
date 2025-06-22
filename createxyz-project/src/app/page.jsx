"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [selectedModel, setSelectedModel] = React.useState("gpt-4");
  const [messages, setMessages] = React.useState([]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("chat");
  const [customBots, setCustomBots] = React.useState([
    {
      id: 1,
      name: "Creative Writer",
      personality: "A creative and imaginative writer who loves storytelling",
      instructions:
        "Help users with creative writing, storytelling, and imaginative content.",
    },
    {
      id: 2,
      name: "Code Assistant",
      personality: "A helpful programming expert",
      instructions:
        "Assist with coding questions, debugging, and software development.",
    },
    {
      id: 3,
      name: "Study Buddy",
      personality: "An encouraging and patient tutor",
      instructions:
        "Help explain complex topics in simple terms and provide study assistance.",
    },
    {
      id: 4,
      name: "Business Advisor",
      personality: "A strategic business consultant with years of experience",
      instructions:
        "Provide business advice, strategy recommendations, and market insights.",
    },
    {
      id: 5,
      name: "Health & Wellness Coach",
      personality: "A supportive and knowledgeable wellness expert",
      instructions:
        "Offer guidance on fitness, nutrition, and general wellness topics.",
    },
  ]);
  const [selectedBot, setSelectedBot] = React.useState(null);
  const [showBotCreator, setShowBotCreator] = React.useState(false);
  const [newBot, setNewBot] = React.useState({
    name: "",
    personality: "",
    instructions: "",
  });
  const [userTier, setUserTier] = React.useState("free"); // 'free' or 'premium'
  const [usageCount, setUsageCount] = React.useState(5); // Free tier limit
  const [streamingMessage, setStreamingMessage] = React.useState("");
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [collapsedProviders, setCollapsedProviders] = React.useState({
    OpenAI: false,
    Anthropic: false,
    Google: false,
  });

  // Handle streaming responses
  const handleFinish = React.useCallback((message) => {
    setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    setStreamingMessage("");
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const models = [
    // OpenAI Models
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      tier: "premium",
      description:
        "Most capable GPT model for complex reasoning and creative tasks",
      endpoint: "/integrations/chat-gpt/conversationgpt4",
      strengths: ["Reasoning", "Creativity", "Code"],
      speed: 3,
      reasoning: 5,
      creativity: 5,
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      tier: "free",
      description: "Fast and efficient for most everyday tasks",
      endpoint: "/integrations/chat-gpt/conversationgpt4",
      strengths: ["Speed", "General Tasks"],
      speed: 5,
      reasoning: 4,
      creativity: 4,
    },

    // Anthropic Models
    {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      tier: "premium",
      description: "Anthropic's most advanced model with excellent reasoning",
      endpoint: "/integrations/anthropic-claude-sonnet-3-5/",
      strengths: ["Analysis", "Writing", "Safety"],
      speed: 4,
      reasoning: 5,
      creativity: 4,
    },

    // Google Models
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "Google",
      tier: "premium",
      description: "Google's most advanced model for complex reasoning",
      endpoint: "/integrations/google-gemini-1-5/",
      strengths: ["Multimodal", "Long Context"],
      speed: 3,
      reasoning: 5,
      creativity: 4,
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "Google",
      tier: "free",
      description: "Fast and efficient for everyday tasks",
      endpoint: "/integrations/google-gemini-1-5/",
      strengths: ["Speed", "Efficiency"],
      speed: 5,
      reasoning: 4,
      creativity: 4,
    },
    {
      id: "gemini-1.0-pro",
      name: "Gemini 1.0 Pro",
      provider: "Google",
      tier: "free",
      description: "Reliable model for general use",
      endpoint: "/integrations/google-gemini-1-5/",
      strengths: ["Reliability", "General Tasks"],
      speed: 4,
      reasoning: 3,
      creativity: 3,
    },
  ];

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const selectedModelData = models.find((m) => m.id === selectedModel);

    // Check usage limits for free tier
    if (
      userTier === "free" &&
      selectedModelData?.tier === "premium" &&
      usageCount <= 0
    ) {
      setError(
        "Free tier limit reached for premium models. Upgrade to continue or use a free model."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const userMessage = { role: "user", content: inputMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");

    try {
      const systemPrompt = selectedBot
        ? `You are ${selectedBot.name}. ${selectedBot.personality}. ${selectedBot.instructions}`
        : "You are a helpful AI assistant.";

      const requestBody = {
        messages: [{ role: "system", content: systemPrompt }, ...newMessages],
        stream: true,
      };

      const response = await fetch(selectedModelData.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      // Handle streaming response
      handleStreamResponse(response);

      // Decrease usage count for premium models on free tier
      if (userTier === "free" && selectedModelData?.tier === "premium") {
        setUsageCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to get response from AI model. Please try again.");
      setIsLoading(false);
    }
  };

  // Update loading state when streaming finishes
  React.useEffect(() => {
    if (streamingMessage === "" && isLoading) {
      setIsLoading(false);
    }
  }, [streamingMessage, isLoading]);

  const createBot = () => {
    if (!newBot.name.trim() || !newBot.personality.trim()) return;

    const bot = {
      id: Date.now(),
      name: newBot.name,
      personality: newBot.personality,
      instructions: newBot.instructions,
    };

    setCustomBots([...customBots, bot]);
    setNewBot({ name: "", personality: "", instructions: "" });
    setShowBotCreator(false);
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingMessage("");
    setError(null);
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case "OpenAI":
        return "from-green-500 to-teal-500";
      case "Anthropic":
        return "from-orange-500 to-red-500";
      case "Google":
        return "from-blue-500 to-purple-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "OpenAI":
        return "fas fa-robot";
      case "Anthropic":
        return "fas fa-brain";
      case "Google":
        return "fab fa-google";
      default:
        return "fas fa-microchip";
    }
  };

  // Theme classes
  const themeClasses = {
    background: isDarkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-blue-50 to-indigo-100",
    headerBg: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-600" : "border-gray-200",
    borderHover: isDarkMode ? "border-gray-500" : "border-gray-300",
    inputBg: isDarkMode
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-white border-gray-300",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
      : "bg-gray-300 text-gray-700 hover:bg-gray-400",
    messageBg: isDarkMode ? "bg-gray-700" : "bg-gray-100",
    messageText: isDarkMode ? "text-gray-100" : "text-gray-900",
    errorBg: isDarkMode
      ? "bg-red-900 border-red-700"
      : "bg-red-50 border-red-200",
    errorText: isDarkMode ? "text-red-300" : "text-red-600",
    tabActive: "bg-blue-500 text-white shadow-sm",
    tabInactive: isDarkMode
      ? "text-gray-300 hover:text-white"
      : "text-gray-600 hover:text-gray-900",
    modalOverlay: "bg-black bg-opacity-50",
    selectedBorder: "border-blue-500 bg-blue-50",
    selectedBorderDark: isDarkMode
      ? "border-blue-400 bg-blue-900"
      : "border-blue-500 bg-blue-50",
  };

  const toggleProvider = (provider) => {
    setCollapsedProviders((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header */}
      <header
        className={`${themeClasses.headerBg} shadow-sm border-b ${themeClasses.border}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-brain text-white text-lg"></i>
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${themeClasses.text} font-inter`}
                >
                  AI Hub
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Ultimate AI Platform Aggregator
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                <i
                  className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-lg`}
                ></i>
              </button>

              <div className="text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userTier === "premium"
                      ? "bg-gold-100 text-gold-800 border border-gold-200"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {userTier === "premium"
                    ? "Premium"
                    : `Free (${usageCount} premium uses left)`}
                </span>
              </div>
              {userTier === "free" && (
                <button
                  onClick={() => setUserTier("premium")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Upgrade to Premium - $0.99 Lifetime
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div
          className={`flex space-x-1 ${themeClasses.cardBg} rounded-lg p-1 shadow-sm mb-6`}
        >
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "chat"
                ? themeClasses.tabActive
                : themeClasses.tabInactive
            }`}
          >
            <i className="fas fa-comments mr-2"></i>
            Chat with AI
          </button>
          <button
            onClick={() => setActiveTab("bots")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "bots"
                ? themeClasses.tabActive
                : themeClasses.tabInactive
            }`}
          >
            <i className="fas fa-robot mr-2"></i>
            Custom Bots
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "models"
                ? themeClasses.tabActive
                : themeClasses.tabInactive
            }`}
          >
            <i className="fas fa-cogs mr-2"></i>
            Model Comparison
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "playground"
                ? themeClasses.tabActive
                : themeClasses.tabInactive
            }`}
          >
            <i className="fas fa-flask mr-2"></i>
            AI Playground
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Model Selection */}
              <div
                className={`${themeClasses.cardBg} rounded-lg shadow-sm p-4`}
              >
                <h3
                  className={`font-semibold ${themeClasses.text} mb-3 font-inter`}
                >
                  Select AI Model
                </h3>
                <div className="space-y-4">
                  {/* Group models by provider */}
                  {["OpenAI", "Anthropic", "Google"].map((provider) => (
                    <div key={provider} className="space-y-2">
                      <button
                        onClick={() => toggleProvider(provider)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-4 h-4 bg-gradient-to-r ${getProviderColor(
                              provider
                            )} rounded-full flex items-center justify-center`}
                          >
                            <i
                              className={`${getProviderIcon(
                                provider
                              )} text-white text-xs`}
                            ></i>
                          </div>
                          <h4
                            className={`text-sm font-semibold ${themeClasses.text}`}
                          >
                            {provider}
                          </h4>
                          <span className={`text-xs ${themeClasses.textMuted}`}>
                            (
                            {
                              models.filter(
                                (model) => model.provider === provider
                              ).length
                            }{" "}
                            models)
                          </span>
                        </div>
                        <i
                          className={`fas ${
                            collapsedProviders[provider]
                              ? "fa-chevron-right"
                              : "fa-chevron-down"
                          } text-xs ${
                            themeClasses.textMuted
                          } transition-transform`}
                        ></i>
                      </button>

                      {!collapsedProviders[provider] && (
                        <div className="space-y-2 ml-6">
                          {models
                            .filter((model) => model.provider === provider)
                            .map((model) => (
                              <button
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                disabled={
                                  userTier === "free" &&
                                  model.tier === "premium" &&
                                  usageCount <= 0
                                }
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  selectedModel === model.id
                                    ? themeClasses.selectedBorderDark
                                    : `${themeClasses.border} hover:${themeClasses.borderHover}`
                                } ${
                                  userTier === "free" &&
                                  model.tier === "premium" &&
                                  usageCount <= 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`font-medium text-sm ${themeClasses.text}`}
                                  >
                                    {model.name}
                                  </span>
                                  {model.tier === "premium" && (
                                    <span className="text-xs bg-gold-100 text-gold-800 px-2 py-1 rounded">
                                      Premium
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-xs ${themeClasses.textSecondary}`}
                                >
                                  {model.description}
                                </p>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bot Selection */}
              <div
                className={`${themeClasses.cardBg} rounded-lg shadow-sm p-4`}
              >
                <h3
                  className={`font-semibold ${themeClasses.text} mb-3 font-inter`}
                >
                  AI Personality
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedBot(null)}
                    className={`w-full text-left p-2 rounded-lg border transition-all ${
                      !selectedBot
                        ? themeClasses.selectedBorder
                        : `${themeClasses.border} hover:${themeClasses.borderHover}`
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${themeClasses.text}`}
                    >
                      Default Assistant
                    </span>
                  </button>
                  {customBots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => setSelectedBot(bot)}
                      className={`w-full text-left p-2 rounded-lg border transition-all ${
                        selectedBot?.id === bot.id
                          ? themeClasses.selectedBorder
                          : `${themeClasses.border} hover:${themeClasses.borderHover}`
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${themeClasses.text}`}
                      >
                        {bot.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              <div
                className={`${themeClasses.cardBg} rounded-lg shadow-sm h-[600px] flex flex-col`}
              >
                {/* Chat Header */}
                <div
                  className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}
                >
                  <div>
                    <h3
                      className={`font-semibold ${themeClasses.text} font-inter`}
                    >
                      {selectedBot ? selectedBot.name : "AI Assistant"}
                    </h3>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      Powered by{" "}
                      {models.find((m) => m.id === selectedModel)?.name}
                    </p>
                  </div>
                  <button
                    onClick={clearChat}
                    className={`${themeClasses.textMuted} hover:${themeClasses.text} p-2 transition-colors`}
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && !streamingMessage && (
                    <div
                      className={`text-center ${themeClasses.textMuted} mt-20`}
                    >
                      <i
                        className={`fas fa-comments text-4xl mb-4 ${
                          isDarkMode ? "text-gray-600" : "text-gray-300"
                        }`}
                      ></i>
                      <p>Start a conversation with your AI assistant</p>
                      <p className="text-sm mt-2">
                        {selectedBot
                          ? `Chatting with ${selectedBot.name}`
                          : "Using default assistant"}
                      </p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : `${themeClasses.messageBg} ${themeClasses.messageText}`
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Streaming Message */}
                  {streamingMessage && (
                    <div className="flex justify-start">
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${themeClasses.messageBg} ${themeClasses.messageText}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {streamingMessage}
                        </p>
                        <div className="flex space-x-1 mt-2">
                          <div
                            className={`w-1 h-1 ${
                              isDarkMode ? "bg-gray-500" : "bg-gray-400"
                            } rounded-full animate-bounce`}
                          ></div>
                          <div
                            className={`w-1 h-1 ${
                              isDarkMode ? "bg-gray-500" : "bg-gray-400"
                            } rounded-full animate-bounce`}
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className={`w-1 h-1 ${
                              isDarkMode ? "bg-gray-500" : "bg-gray-400"
                            } rounded-full animate-bounce`}
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoading && !streamingMessage && (
                    <div className="flex justify-start">
                      <div
                        className={`${themeClasses.messageBg} p-3 rounded-lg`}
                      >
                        <div className="flex space-x-1">
                          <div
                            className={`w-2 h-2 ${
                              isDarkMode ? "bg-gray-500" : "bg-gray-400"
                            } rounded-full animate-bounce`}
                          ></div>
                          <div
                            className={`w-2 h-2 ${
                              isDarkMode ? "bg-gray-500" : "bg-gray-400"
                            } rounded-full animate-bounce`}
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className={`w-2 h-2 ${
                              isDarkMode ? "bg-gray-500" : "bg-gray-400"
                            } rounded-full animate-bounce`}
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div
                    className={`p-4 ${themeClasses.errorBg} border-t ${themeClasses.border}`}
                  >
                    <p className={`${themeClasses.errorText} text-sm`}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Input Area */}
                <div className={`p-4 border-t ${themeClasses.border}`}>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendMessage()
                      }
                      placeholder="Type your message..."
                      className={`flex-1 ${themeClasses.inputBg} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Bots Tab */}
        {activeTab === "bots" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2
                className={`text-2xl font-bold ${themeClasses.text} font-inter`}
              >
                Custom AI Bots
              </h2>
              <button
                onClick={() => setShowBotCreator(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Bot
              </button>
            </div>

            {/* Bot Creator Modal */}
            {showBotCreator && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div
                  className={`${themeClasses.cardBg} rounded-lg max-w-md w-full p-6`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 font-inter ${themeClasses.text}`}
                  >
                    Create Custom Bot
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${themeClasses.text} mb-1`}
                      >
                        Bot Name
                      </label>
                      <input
                        type="text"
                        value={newBot.name}
                        onChange={(e) =>
                          setNewBot({ ...newBot, name: e.target.value })
                        }
                        className={`w-full ${themeClasses.inputBg} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., Creative Writer"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${themeClasses.text} mb-1`}
                      >
                        Personality
                      </label>
                      <textarea
                        value={newBot.personality}
                        onChange={(e) =>
                          setNewBot({ ...newBot, personality: e.target.value })
                        }
                        className={`w-full ${themeClasses.inputBg} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        rows="3"
                        placeholder="Describe the bot's personality and tone..."
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${themeClasses.text} mb-1`}
                      >
                        Instructions
                      </label>
                      <textarea
                        value={newBot.instructions}
                        onChange={(e) =>
                          setNewBot({ ...newBot, instructions: e.target.value })
                        }
                        className={`w-full ${themeClasses.inputBg} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        rows="3"
                        placeholder="What should this bot help with?"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={createBot}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Bot
                    </button>
                    <button
                      onClick={() => setShowBotCreator(false)}
                      className={`flex-1 ${themeClasses.buttonSecondary} py-2 rounded-lg transition-colors`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customBots.map((bot) => (
                <div
                  key={bot.id}
                  className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <i className="fas fa-robot text-white text-lg"></i>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBot(bot);
                        setActiveTab("chat");
                      }}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Chat Now
                    </button>
                  </div>
                  <h3
                    className={`font-semibold ${themeClasses.text} mb-2 font-inter`}
                  >
                    {bot.name}
                  </h3>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                    {bot.personality}
                  </p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>
                    {bot.instructions}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Comparison Tab */}
        {activeTab === "models" && (
          <div className="space-y-6">
            <h2
              className={`text-2xl font-bold ${themeClasses.text} font-inter`}
            >
              AI Model Comparison
            </h2>

            {/* Provider Sections */}
            {["OpenAI", "Anthropic", "Google"].map((provider) => (
              <div key={provider} className="space-y-4">
                <h3
                  className={`text-xl font-semibold ${themeClasses.text} font-inter flex items-center`}
                >
                  <div
                    className={`w-6 h-6 bg-gradient-to-r ${getProviderColor(
                      provider
                    )} rounded-full flex items-center justify-center mr-3`}
                  >
                    <i
                      className={`${getProviderIcon(
                        provider
                      )} text-white text-sm`}
                    ></i>
                  </div>
                  {provider} Models
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {models
                    .filter((model) => model.provider === provider)
                    .map((model) => (
                      <div
                        key={model.id}
                        className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4
                            className={`font-semibold ${themeClasses.text} font-inter`}
                          >
                            {model.name}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              model.tier === "premium"
                                ? "bg-gold-100 text-gold-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {model.tier === "premium" ? "Premium" : "Free"}
                          </span>
                        </div>

                        <p
                          className={`${themeClasses.textSecondary} text-sm mb-4`}
                        >
                          {model.description}
                        </p>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className={themeClasses.textMuted}>
                              Speed:
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i <= model.speed
                                      ? "bg-blue-500"
                                      : isDarkMode
                                      ? "bg-gray-600"
                                      : "bg-gray-200"
                                  }`}
                                ></div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className={themeClasses.textMuted}>
                              Reasoning:
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i <= model.reasoning
                                      ? "bg-green-500"
                                      : isDarkMode
                                      ? "bg-gray-600"
                                      : "bg-gray-200"
                                  }`}
                                ></div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className={themeClasses.textMuted}>
                              Creativity:
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i <= model.creativity
                                      ? "bg-purple-500"
                                      : isDarkMode
                                      ? "bg-gray-600"
                                      : "bg-gray-200"
                                  }`}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p
                            className={`text-xs ${themeClasses.textMuted} mb-2`}
                          >
                            Strengths:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {model.strengths.map((strength) => (
                              <span
                                key={strength}
                                className={`px-2 py-1 ${
                                  isDarkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-100 text-gray-700"
                                } text-xs rounded`}
                              >
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedModel(model.id);
                            setActiveTab("chat");
                          }}
                          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Try This Model
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Playground Tab */}
        {activeTab === "playground" && (
          <div className="space-y-6">
            <h2
              className={`text-2xl font-bold ${themeClasses.text} font-inter`}
            >
              AI Playground
            </h2>
            <p className={themeClasses.textSecondary}>
              Compare responses from multiple AI models simultaneously
            </p>

            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <h3
                className={`font-semibold ${themeClasses.text} mb-4 font-inter`}
              >
                Coming Soon!
              </h3>
              <div className="text-center py-12">
                <i
                  className={`fas fa-flask text-6xl mb-4 ${
                    isDarkMode ? "text-gray-600" : "text-gray-300"
                  }`}
                ></i>
                <p className={`${themeClasses.textMuted} mb-4`}>
                  Multi-model comparison playground is in development
                </p>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  Test the same prompt across all AI models and compare their
                  responses side by side
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;