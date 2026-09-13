import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erro nao tratado na interface:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="loginShell">
        <section className="loginPanel systemStatePanel">
          <div className="brand loginBrand">
            <div className="brandMark"><AlertTriangle size={20} /></div>
            <div>
              <strong>Meu Serviço Online</strong>
              <span>Algo deu errado nesta tela</span>
            </div>
          </div>
          <p className="loginCopy">
            Um erro inesperado interrompeu o carregamento. Recarregue a página — se o problema continuar, avise o suporte.
          </p>
          <button className="primary" onClick={() => window.location.reload()}>Recarregar página</button>
        </section>
      </main>
    )
  }
}
