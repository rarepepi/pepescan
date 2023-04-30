describe("Pepe Transfer App", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("displays the table with the correct headers", () => {
    cy.get("table").should("be.visible");
    cy.get("thead > tr > th:nth-child(1)").contains("Hash");
    cy.get("thead > tr > th:nth-child(2)").contains("From");
    cy.get("thead > tr > th:nth-child(3)").contains("To");
    cy.get("thead > tr > th:nth-child(4)").contains("Quantity");
  });
});
