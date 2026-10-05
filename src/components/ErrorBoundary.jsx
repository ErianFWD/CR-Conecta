import React from 'react';
import { TriangleAlert, RotateCcw } from 'lucide-react';

// Evita que un error en una pantalla deje toda la aplicación en blanco.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error en la pantalla:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="error-panel" role="alert">
          <TriangleAlert size={34} />
          <h2>Algo salió mal en esta pantalla</h2>
          <p>El resto de la aplicación sigue funcionando. Podés volver a intentarlo o ir al inicio.</p>
          <div className="error-actions">
            <button className="btn primary" onClick={() => this.setState({ error: null })}>
              <RotateCcw className="i i-l" size={14} />Reintentar
            </button>
            <a className="btn secondary" href="/">Ir al inicio</a>
          </div>
        </div>
      </div>
    );
  }
}
