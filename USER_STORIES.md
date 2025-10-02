# User Stories - Application Bancaire BNG

## US010 - Demande de RIB

**En tant qu'** utilisateur de l'application bancaire BNG  
**Je veux** pouvoir demander un Relevé d'Identité Bancaire (RIB) pour mon compte  
**Afin de** pouvoir communiquer mes coordonnées bancaires pour recevoir des virements

### Critères d'acceptation

#### Scénario 1: Accès à la demande de RIB
- **Étant donné** que je suis sur la page des détails de mon compte
- **Quand** je consulte les actions disponibles
- **Alors** je vois un bouton "Demander RIB" à côté du bouton "Demander Relevé"

#### Scénario 2: Sélection du mode de livraison
- **Étant donné** que j'ai cliqué sur "Demander RIB"
- **Quand** j'arrive sur la page de demande de RIB
- **Alors** je vois les informations de mon compte sélectionné
- **Et** je peux choisir parmi 4 modes de livraison :
  - Par email (immédiat)
  - Par SMS (immédiat)
  - Dans l'application (immédiat)
  - En agence (24h ouvrables)

#### Scénario 3: Validation de la demande
- **Étant donné** que j'ai sélectionné un mode de livraison
- **Quand** je clique sur "Envoyer la demande"
- **Alors** ma demande est traitée
- **Et** je reçois une confirmation avec le délai de livraison
- **Et** je suis redirigé vers la page précédente

#### Scénario 4: Gestion des erreurs
- **Étant donné** que je n'ai pas sélectionné de mode de livraison
- **Quand** je tente d'envoyer la demande
- **Alors** je reçois un message d'erreur me demandant de sélectionner un mode
- **Et** le bouton reste désactivé

### Règles métier
- Un RIB peut être demandé pour tout compte actif
- Les modes de livraison électroniques sont instantanés
- La livraison en agence nécessite un délai de 24h ouvrables
- Le RIB contient : IBAN, BIC, nom du titulaire, adresse de la banque

### Définition of Done
- [ ] Interface utilisateur conforme aux maquettes
- [ ] Validation des champs obligatoires
- [ ] Gestion des états de chargement
- [ ] Messages d'erreur et de succès appropriés
- [ ] Tests unitaires et d'intégration
- [ ] Responsive design
- [ ] Accessibilité respectée
- [ ] Documentation technique mise à jour

### Notes techniques
- Intégration avec l'API de génération de RIB
- Gestion des notifications selon le mode choisi
- Historique des demandes de RIB
- Sécurisation des données sensibles

### Priorité
**Haute** - Fonctionnalité essentielle pour les opérations bancaires courantes

### Estimation
**5 points** (Complexité moyenne avec interface et intégrations)
