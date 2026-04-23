import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormatChatPipe } from '../../pipes/format-chat.pipe';

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
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLTextAreaElement>;

  private readonly API_KEY = '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';
  private readonly MODEL = 'gpt-4o-mini';

  isOpen = signal(false);
  isMinimized = signal(false);
  isLoading = signal(false);
  inputText = '';
  private shouldScroll = false;

  messages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'ARIA online. I\'m your ICS/SCADA security intelligence assistant. Ask me about threats, protocols, incidents, or compliance — I\'m here to help keep your infrastructure secure.',
      timestamp: new Date()
    }
  ]);

  conversationHistory = computed(() =>
    this.messages()
      .filter(m => m.role !== 'system' && !m.isStreaming)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  );

  suggestedPrompts = [
    'Explain the MODBUS threat detected',
    'What is TRITON malware?',
    'IEC 62443 compliance checklist',
    'DNP3 protocol security risks',
    'How to isolate a compromised RTU?',
  ];

  ngOnInit() {}
  ngOnDestroy() {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    if (this.isMinimized()) {
      this.isMinimized.set(false);
    } else {
      this.isOpen.update(v => !v);
    }
    if (this.isOpen()) {
      setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
    }
  }

  minimizeChat() {
    this.isMinimized.set(true);
  }

  closeChat() {
    this.isOpen.set(false);
    this.isMinimized.set(false);
  }

  useSuggestion(prompt: string) {
    this.inputText = prompt;
    this.sendMessage();
  }

  async sendMessage() {
    const content = this.inputText.trim();
    if (!content || this.isLoading()) return;

    this.inputText = '';
    this.isLoading.set(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.shouldScroll = true;

    // Add placeholder assistant message
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    this.messages.update(msgs => [...msgs, assistantMsg]);

    try {
      const history = this.conversationHistory().slice(0, -1); // exclude the placeholder

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content }
          ],
          stream: true,
          max_tokens: 800,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              this.messages.update(msgs =>
                msgs.map(m => m.id === assistantId
                  ? { ...m, content: accumulated }
                  : m
                )
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
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantId
          ? { ...m, content: `⚠ Error: ${err.message || 'Failed to connect to AI service.'}`, isStreaming: false }
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
      id: 'welcome',
      role: 'assistant',
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
