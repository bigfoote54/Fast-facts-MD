import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';
import { ConversationMessage, QuestionPayload } from '../../../shared/types';

type ChatRole = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: Date;
}

const parseEnvNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const MAX_QUESTION_LENGTH = parseEnvNumber(process.env.EXPO_PUBLIC_MAX_QUESTION_LENGTH, 280);
const MAX_HISTORY_FOR_PAYLOAD = parseEnvNumber(process.env.EXPO_PUBLIC_MAX_HISTORY_MESSAGES, 6);

const SAMPLE_QUESTIONS = [
  'Summarize the pathophysiology of heart failure.',
  'How do beta blockers work and what are common side effects?',
  'Create a mnemonic for the cranial nerves.',
];

const initialMessage: Message = {
  id: 'greeting',
  role: 'system',
  text: "Hello! I'm Fast Facts MD, your AI study assistant for medical and nursing questions. Ask me about anatomy, pharmacology, pathophysiology, or clinical procedures.",
  timestamp: new Date(),
};

const isConversationMessage = (message: Message): message is Message & { role: 'user' | 'assistant' } =>
  message.role === 'user' || message.role === 'assistant';

const buildConversation = (history: Message[]): ConversationMessage[] =>
  history
    .filter(isConversationMessage)
    .map(message => ({ role: message.role, content: message.text }))
    .slice(-MAX_HISTORY_FOR_PAYLOAD);

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const characterCount = inputText.length;
  const remainingCharacters = MAX_QUESTION_LENGTH - characterCount;

  const sendMessage = useCallback(async () => {
    const trimmedQuestion = inputText.trim();

    if (!trimmedQuestion || isSending) {
      return;
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      Alert.alert('Error', `Question must be ${MAX_QUESTION_LENGTH} characters or less`);
      return;
    }

    const conversationHistory = buildConversation(messages);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmedQuestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    Keyboard.dismiss();
    setIsSending(true);

    try {
      const questionPayload: QuestionPayload = {
        question: trimmedQuestion,
        conversation: conversationHistory,
      };
      const response = await apiService.askQuestion(questionPayload);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Request failed', errorMessage);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, messages]);

  const handleSamplePress = useCallback(
    (sample: string) => {
      setInputText(sample);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    },
    [],
  );

  const isSendDisabled = useMemo(() => !inputText.trim() || isSending, [inputText, isSending]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Fast Facts MD</Text>
          <Text style={styles.subtitle}>Medical Study Assistant</Text>
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerTitle}>Study Support Only</Text>
          <Text style={styles.disclaimerText}>
            Responses are for learning purposes and do not replace professional medical advice or clinical
            judgment.
          </Text>
        </View>

        <View style={styles.samplesContainer}>
          {SAMPLE_QUESTIONS.map(sample => (
            <TouchableOpacity
              key={sample}
              style={styles.sampleChip}
              onPress={() => handleSamplePress(sample)}
              accessibilityRole="button"
            >
              <Text style={styles.sampleChipText}>{sample}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.charCount, remainingCharacters < 0 && styles.charCountExceeded]}>
              {`${Math.max(remainingCharacters, 0)} characters left`}
            </Text>

            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a medical question..."
              placeholderTextColor="#666"
              multiline
              maxLength={MAX_QUESTION_LENGTH}
              testID="chat-input"
              editable={!isSending}
              accessibilityLabel="Ask a medical question"
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isSendDisabled}
            testID="send-button"
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser && styles.userMessage,
        isAssistant && styles.aiMessage,
        message.role === 'system' && styles.systemMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          isUser && styles.userMessageText,
          isAssistant && styles.aiMessageText,
        ]}
      >
        {message.text}
      </Text>
      <Text
        style={[
          styles.timestamp,
          isUser && styles.userTimestamp,
          isAssistant && styles.aiTimestamp,
        ]}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2c5aa0',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messagesContent: {
    paddingBottom: 12,
  },
  messageContainer: {
    marginVertical: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#2c5aa0',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  systemMessage: {
    backgroundColor: '#e8f1ff',
    alignSelf: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
  },
  aiTimestamp: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerContainer: {
    backgroundColor: '#fff5e6',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd7a8',
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8a4d0f',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#8a4d0f',
    lineHeight: 18,
  },
  samplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 12,
  },
  sampleChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  sampleChipText: {
    color: '#225ea8',
    fontSize: 13,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    textAlign: 'right',
    paddingRight: 12,
  },
  charCountExceeded: {
    color: '#c62828',
  },
});
