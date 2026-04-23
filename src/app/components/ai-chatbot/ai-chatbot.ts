import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormatChatPipe } from '../../pipes/format-chat.pipe';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const SYSTEM_PROMPT = `You are ARIA (Advanced Response & Intelligence Agent), the AI security assistant for OverWatch — an ICS/SCADA Security Operations Center platform.

Your capabilities:
- Analyze ICS/SCADA security threats, vulnerabilities, and incidents
- Explain OT/IT protocols: MODBUS, DNP3, OPC-UA, ICMP, BACnet, EtherNet/IP
- Provide incident response guidance for industrial control systems
- Assist with compliance: IEC 62443, NERC CIP, NIST CSF
- Interpret security logs, alerts, and anomaly patterns
- Explain threat actor TTPs relevant to critical infrastructure

Tone: Professional, concise, security-focused. Use technical terminology but explain when needed.
Format: Use clear structure. For lists, use short bullet points. Keep responses focused and actionable.
Context: You are integrated into a live SOC dashboard monitoring 48 ICS nodes across multiple sectors.`;

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatChatPipe],
  templateUrl: './ai-chatbot.html',
  styleUrls: ['./ai-chatbot.css']
})
export class AiChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('inputRef')    inputRef!:    ElementRef<HTMLTextAreaElement>;

  private readonly API_KEY = environment.geminiApiKey;
  // Gemini 2.0 Flash — fast, free-tier generous, supports streaming
  private readonly MODEL = 'gemini-2.5-flash';

  isOpen      = signal(false);
  isMinimized = signal(false);
  isLoading   = signal(false);
  inputText   = '';
  private shouldScroll = false;

  messages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'ARIA online. I\'m your ICS/SCADA security intelligence assistant. Ask me about threats, protocols, incidents, or compliance — I\'m here to help keep your infrastructure secure.',
      timestamp: new Date()
    }
  ]);

  suggestedPrompts = [
    'Explain the MODBUS threat detected',
    'What is TRITON malware?',
    'IEC 62443 compliance checklist',
    'DNP3 protocol security risks',
    'How to isolate a compromised RTU?',
  ];

  ngOnInit()    {}
  ngOnDestroy() {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    if (this.isMinimized()) this.isMinimized.set(false);
    else this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
    }
  }

  minimizeChat() { this.isMinimized.set(true); }
  closeChat()    { this.isOpen.set(false); this.isMinimized.set(false); }

  useSuggestion(prompt: string) {
    this.inputText = prompt;
    this.sendMessage();
  }

  // Compatible ID generator — works on http://, https://, and all browsers
  private makeId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
  }

  async sendMessage() {
    const content = this.inputText.trim();
    if (!content || this.isLoading()) return;

    this.inputText = '';
    this.isLoading.set(true);

    // Snapshot history BEFORE adding new messages (prevents race with streaming placeholder)
    const history = this.messages()
      .filter(m => m.id !== 'welcome' && !m.isStreaming && m.content.trim())
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',  // Gemini uses 'model' not 'assistant'
        parts: [{ text: m.content }]
      }));

    // Append user message
    const userMsg: ChatMessage = {
      id: this.makeId(), role: 'user', content, timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.shouldScroll = true;

    // Append streaming placeholder
    const assistantId = this.makeId();
    this.messages.update(msgs => [...msgs, {
      id: assistantId, role: 'assistant', content: '',
      timestamp: new Date(), isStreaming: true
    }]);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:streamGenerateContent?alt=sse&key=${this.API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: content }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ARIA] Gemini error body:', errorText);
        let errMsg = `API ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errMsg = parsed.error?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const reader  = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            const delta  = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) {
              accumulated += delta;
              this.messages.update(msgs =>
                msgs.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
              );
              this.shouldScroll = true;
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      // Mark streaming complete
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
      );

    } catch (err: any) {
      console.error('[ARIA] Error:', err);
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantId
          ? { ...m, content: `⚠ Error: ${err.message || 'Failed to connect to Gemini.'}`, isStreaming: false }
          : m
        )
      );
    }

    this.isLoading.set(false);
    this.shouldScroll = true;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages.set([{
      id: 'welcome', role: 'assistant',
      content: 'Chat cleared. ARIA ready for new queries.',
      timestamp: new Date()
    }]);
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  trackById(_: number, msg: ChatMessage) { return msg.id; }
}
