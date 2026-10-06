import { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { validateAssistantPath } from '../constants/assistantNavigation';
import { api } from '../lib/api';
import { useData } from '../lib/useData';

export function Chat() {
  const navigate = useNavigate();
  const { data: answers = [], state: chatState } = useData('/chatbot');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const conversationEnd = useRef(null);
  const navigationTimer = useRef(null);

  useEffect(() => () => clearTimeout(navigationTimer.current), []);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const ask = async (value) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion || sending) return;

    const history = messages.slice(-4).flatMap(message => [
      { role: 'user', content: message.question },
      { role: 'assistant', content: message.answer }
    ]);
    setMessages(previous => [...previous, { question: cleanQuestion, answer: null }]);
    setQuestion('');
    setError('');
    setSending(true);
    try {
      const response = await api('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ question: cleanQuestion, history })
      });
      const destination = validateAssistantPath(response.destination?.path);
      setMessages(previous => previous.map((message, index) => (
        index === previous.length - 1 && message.answer === null
          ? { ...message, answer: response.answer, destination }
          : message
      )));
      if (destination && destination.path !== '/chat') {
        clearTimeout(navigationTimer.current);
        navigationTimer.current = setTimeout(() => navigate(destination.path), 1800);
      }
    } catch (assistantError) {
      setMessages(previous => previous.slice(0, -1));
      setError(assistantError.message || 'No se pudo obtener una respuesta del asistente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ASISTENTE IA · CR CONECTA</span>
        <h1>Orientación comunitaria</h1>
        <p>Preguntame lo que necesites: puedo ayudarte con temas generales, redacción, ideas, análisis, programación y orientación sobre CR Conecta. También puedo llevarte a sus secciones públicas.</p>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: '20px', border: '1px solid var(--line)', maxWidth: '750px', overflow: 'hidden' }}>
        <div aria-live="polite" aria-busy={sending} style={{ minHeight: '260px', maxHeight: '520px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--muted)' }}>
              <MessageSquare size={30} />
              <p style={{ margin: '8px 0 0', fontSize: '0.8125rem' }}>
                {chatState === 'loading' ? 'Preparando el asistente…' : '¡Hola! Puedo orientarte sobre cómo funciona CR Conecta.'}
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${index}-${message.question}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ alignSelf: 'flex-end', background: 'var(--brand-solid)', color: 'var(--white)', padding: '10px 16px', borderRadius: '14px 14px 2px 14px', fontSize: '0.78125rem', maxWidth: '85%' }}>
                  {message.question}
                </div>
                {message.answer === null
                  ? <div role="status" style={{ alignSelf: 'flex-start', color: 'var(--muted)', padding: '10px', fontSize: '0.8125rem' }}>Estoy preparando la respuesta…</div>
                  : <div style={{ alignSelf: 'flex-start', background: 'var(--surface-soft)', color: 'var(--navy)', padding: '12px 16px', borderRadius: '2px 14px 14px 14px', fontSize: '0.8125rem', maxWidth: '85%', whiteSpace: 'pre-wrap' }}>
                    {message.answer}
                    {message.destination && message.destination.path !== '/chat' && (
                      <div style={{ marginTop: '12px' }}>
                        <button className="btn primary" type="button" onClick={() => {
                          clearTimeout(navigationTimer.current);
                          navigate(message.destination.path);
                        }}>
                          Ir a {message.destination.label}
                        </button>
                      </div>
                    )}
                  </div>}
              </div>
            ))
          )}
          <div ref={conversationEnd} />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--danger-fg)', padding: '0 20px', margin: '0 0 12px', fontSize: '0.8125rem' }}>
            {error}
          </p>
        )}

        <form onSubmit={event => { event.preventDefault(); void ask(question); }} style={{ background: 'var(--surface-soft)', padding: '16px 20px', borderTop: '1px solid var(--line-light)' }}>
          <label htmlFor="assistant-question" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>Tu pregunta</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="assistant-question"
              value={question}
              maxLength={10000}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ej. ¿Cómo registro una donación?"
              style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: '20px', border: '1px solid var(--line)' }}
              disabled={sending}
            />
            <button className="btn primary" type="submit" disabled={sending || !question.trim()}>
              {sending ? 'Consultando…' : 'Enviar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {answers.map(answer => (
              <button
                key={answer.id}
                type="button"
                disabled={sending}
                onClick={() => void ask(answer.question)}
                style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '20px', padding: '7px 14px', fontSize: '0.75rem', color: 'var(--navy)', fontWeight: '600' }}
              >
                {answer.question}
              </button>
            ))}
          </div>
        </form>
      </div>
      <p style={{ maxWidth: '750px', fontSize: '0.75rem', color: 'var(--muted)' }}>
        La IA puede equivocarse. No compartas información personal o sensible. Solo puede abrir secciones públicas de CR Conecta.
      </p>
    </div>
  );
}
