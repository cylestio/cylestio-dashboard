describe('Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the dashboard successfully', () => {
    cy.get('.sidebar').should('be.visible')
    cy.get('.top-header').should('be.visible')
    cy.get('.main-content').should('be.visible')
  })

  it('should display all main statistics', () => {
    cy.get('#totalLogs').should('exist')
    cy.get('#llmCalls').should('exist')
    cy.get('#avgLLMDuration').should('exist')
    cy.get('#successRate').should('exist')
  })

  it('should switch between tabs', () => {
    cy.get('[data-tab="calls"]').click()
    cy.get('#calls').should('be.visible')
    
    cy.get('[data-tab="llm-metrics"]').click()
    cy.get('#llm-metrics').should('be.visible')
    
    cy.get('[data-tab="tool-usage"]').click()
    cy.get('#tool-usage').should('be.visible')
  })

  it('should toggle dark mode', () => {
    cy.get('.theme-toggle').click()
    cy.get('body').should('have.attr', 'data-theme', 'dark')
    
    cy.get('.theme-toggle').click()
    cy.get('body').should('have.attr', 'data-theme', 'light')
  })

  it('should handle filter buttons', () => {
    cy.get('.filter-buttons .filter-btn').first().click()
    cy.get('.filter-buttons .filter-btn').first().should('have.class', 'active')
  })

  it('should load and display data tables', () => {
    cy.get('[data-tab="calls"]').click()
    cy.get('#callsTable_wrapper').should('exist')
    cy.get('#callsTable').should('exist')
  })

  it('should check accessibility', () => {
    cy.injectAxe()
    cy.checkA11y()
  })
}) 