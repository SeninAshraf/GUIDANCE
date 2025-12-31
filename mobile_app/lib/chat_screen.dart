import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'dart:async';
import '../services/groq_service.dart';

/// ---------------- DATA MODEL ----------------
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

/// ---------------- STATE MANAGEMENT ----------------
final chatProvider =
    StateNotifierProvider<ChatNotifier, List<ChatMessage>>((ref) {
  return ChatNotifier();
});

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier()
      : super([
          ChatMessage(
            text:
                "Hi! I'm GUIDO, your Tech Career Coach. I can help with resume reviews, career paths, and interview prep. Shall we start?",
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ]);

  void addMessage(String text, bool isUser) {
    state = [
      ...state,
      ChatMessage(
        text: text,
        isUser: isUser,
        timestamp: DateTime.now(),
      )
    ];
  }
}

/// ---------------- MAIN UI ----------------
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final GroqService _groqService = GroqService();
  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();

  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  bool _isListening = false;
  bool _isLoading = false;
  bool _isSpeaking = false;
  bool _speechEnabled = false;
  bool _autoListenMode = false;

  // Language State: 'en' for English, 'ml' for Malayalam
  String _currentLanguage = 'en';

  final List<Map<String, dynamic>> _conversationHistory = [];

  @override
  void initState() {
    super.initState();
    _initVoice();
    _initAIContext();
  }

  void _initAIContext() {
    // Defines the Sequential Flow and Language Rules
    const String systemPrompt = '''
You are GUIDO, an expert Tech Career Coach conducting a structured counseling session.
Do NOT give generic advice immediately. Follow this EXACT sequential flow:
1. If this is the start, ask about their current role and years of experience.
2. Once you know their role, ask about their primary tech stack and key skills.
3. Then, ask about their specific career goals (e.g., promotion, switching domains).
4. ONLY after gathering this context, provide tailored, high-value advice.

CRITICAL RULES:
- Ask ONE question at a time.
- Keep responses SHORT (maximum 2 sentences).
- If the user asks a direct question, answer it, but then resume the flow.
- Support both English and Malayalam.
- If the user speaks/selects MALAYALAM, reply strictly in MALAYALAM SCRIPT (e.g., 'നമസ്കാരം'). Do NOT mix English unless for technical terms.
- If English, reply strictly in English.
''';

    _conversationHistory.add({
      'role': 'system',
      'content': systemPrompt,
    });
  }

  Future<void> _initVoice() async {
    _speechEnabled = await _speech.initialize(
      onError: (e) {
        debugPrint('STT Error: $e');
        setState(() => _isListening = false);
      },
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          setState(() => _isListening = false);
        }
      },
    );

    await _flutterTts.setPitch(1.0);
    await _flutterTts.setSpeechRate(0.5);

    _flutterTts.setStartHandler(() {
      setState(() => _isSpeaking = true);
    });

    _flutterTts.setCompletionHandler(() {
      setState(() => _isSpeaking = false);
      if (_autoListenMode && mounted) {
        Future.delayed(const Duration(milliseconds: 500), _listen);
      }
    });

    _flutterTts.setCancelHandler(() {
      setState(() => _isSpeaking = false);
    });
  }

  /// ---------------- LISTEN ----------------
  Future<void> _listen() async {
    if (!_speechEnabled) return;

    if (_isSpeaking) await _stopTTS();

    if (!_isListening) {
      setState(() {
        _isListening = true;
        _autoListenMode = true;
      });

      // Set locale based on selected language
      String localeId = _currentLanguage == 'ml' ? 'ml_IN' : 'en_US';

      _speech.listen(
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        onDevice: true,
        localeId: localeId,
        cancelOnError: true,
        onResult: (val) {
          setState(() {
            _textController.text = val.recognizedWords;
          });
        },
      );
    } else {
      setState(() => _isListening = false);
      _speech.stop();

      if (_textController.text.trim().isNotEmpty) {
        _handleSubmitted(_textController.text);
      }
    }
  }

  /// ---------------- SEND ----------------
  Future<void> _handleSubmitted(String text) async {
    if (text.trim().isEmpty) return;

    _speech.stop();
    await _flutterTts.stop();
    _textController.clear();

    ref.read(chatProvider.notifier).addMessage(text, true);
    _scrollToBottom();

    setState(() {
      _isLoading = true;
      _isListening = false;
    });

    // Enforce Language Context in recent history for robustness
    String langInstruction = _currentLanguage == 'ml'
        ? "(Please reply in MALAYALAM script)"
        : "(Please reply in ENGLISH)";
    
    _conversationHistory.add({'role': 'user', 'content': "$text $langInstruction"});

    try {
      final response =
          await _groqService.getConversationCompletion(_conversationHistory);

      if (mounted) {
        ref.read(chatProvider.notifier).addMessage(response, false);
        _conversationHistory.add({'role': 'assistant', 'content': response});
        _scrollToBottom();
        _speak(response);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// ---------------- SPEAK ----------------
  Future<void> _speak(String text) async {
    await _flutterTts.stop();
    
    // Set TTS Language dynamically
    String ttsLang = _currentLanguage == 'ml' ? 'ml-IN' : 'en-US';
    await _flutterTts.setLanguage(ttsLang);
    
    if (mounted) {
      setState(() => _isSpeaking = true);
      await _flutterTts.speak(text);
    }
  }

  Future<void> _stopTTS() async {
    await _flutterTts.stop();
    setState(() {
      _isSpeaking = false;
      _autoListenMode = false;
    });
  }

  void _changeLanguage(String langCode) {
    setState(() {
      _currentLanguage = langCode;
      _autoListenMode = false; // Reset auto-listen when changing language
    });
    // Optional: Notify AI of context switch
    // _conversationHistory.add({'role': 'system', 'content': 'User switched language to $langCode.'});
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _flutterTts.stop();
    _speech.stop();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// ---------------- UI ----------------
  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Career Guide'),
        actions: [
          // Language Toggle
          DropdownButton<String>(
            value: _currentLanguage,
            icon: const Icon(Icons.language, color: Colors.white),
            dropdownColor: Colors.blue,
            underline: Container(),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            onChanged: (String? newValue) {
              if (newValue != null) _changeLanguage(newValue);
            },
            items: <String>['en', 'ml'].map<DropdownMenuItem<String>>((String value) {
              return DropdownMenuItem<String>(
                value: value,
                child: Text(value == 'en' ? 'ENG' : 'MAL'),
              );
            }).toList(),
          ),
          const SizedBox(width: 16),
          if (_autoListenMode)
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green),
              ),
              child: const Row(
                children: [
                  Icon(Icons.record_voice_over, size: 14, color: Colors.green),
                  SizedBox(width: 4),
                  Text(
                    "Live",
                    style: TextStyle(
                        color: Colors.green,
                        fontSize: 12,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: messages.length,
              itemBuilder: (_, i) => _buildMessageBubble(messages[i]),
            ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8),
              child: Text(
                "Guido is thinking...",
                style: TextStyle(color: Colors.grey),
              ),
            ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          if (_isSpeaking)
            IconButton(
              icon: const Icon(Icons.stop, color: Colors.red),
              onPressed: _stopTTS,
            ),
          IconButton(
            icon: Icon(
              _isListening ? Icons.graphic_eq : Icons.mic,
              color: _isListening ? Colors.red : Colors.black,
            ),
            onPressed: _listen,
          ),
          Expanded(
            child: TextField(
              controller: _textController,
              decoration: InputDecoration(
                hintText: _isListening
                    ? "Listening ($_currentLanguage)..."
                    : "Ask anything ($_currentLanguage)...",
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: _handleSubmitted,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.send),
            onPressed: () => _handleSubmitted(_textController.text),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    return Align(
      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: msg.isUser ? Colors.blue : Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!msg.isUser)
              const Row(
                children: [
                  FaIcon(FontAwesomeIcons.robot, size: 12, color: Colors.grey),
                  SizedBox(width: 6),
                  Text("GUIDO",
                      style: TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
            Text(
              msg.text,
              style: TextStyle(
                  color: msg.isUser ? Colors.white : Colors.black, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}
