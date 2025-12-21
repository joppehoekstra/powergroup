# PowerBrainstorm

PowerBrainstorm is a web app that is supposed to function a bit like PowerPoint, but for group conversations & brainstorms.

It brings computing closer to the physical, rather than forcing people to brainstorm digitally to get the benefits of computing such as AI.

It works like this: on a big screen in a room with a group of people, a facilitator shows this app fullscreen. Beforehand, the facilitator has made slides. Slides, however, function very different. Rather than deciding what comes on the screen, the facilitator sets the slide title, the duration of this part of the agenda (eg 15 minutes), AI instructions and facilitator notes.

The facilitator can click a 'Print instructions' button to get a printout of the facilitator notes and AI instructions, so they can prepare for this part of the session. This way, everything that is digital is also physical. There is no magic going on behind the scenes.

Then, during this part of the session, the facilitator puts up the right slide for this moment.

On the screen are 3 big buttons:

1. Record voice note
2. Connect more devices
3. All our files

When the facilitator connects more devices, such as laptops or smartphones, they can turn on the mobile device's Assistive Mode, to lock down the device to only show this web app, so that people are not distracted by other things on the phone.

Then, on those devices, people can also record voice notes. They can also take pictures of sticky notes, or other diagrams that they drew.

Every time the facilitator sends a new voice note, the app _responds_ using AI based on the instructions the facilitator set before. The AI takes all voice notes and photo’s that people took, and takes them into account in their answer. On the screen, the AI’s response is divided into 4 sections, each taking up a quarter of the screen. Only a large title of the section is shown at first, so that everyone in the room can read it. When you click the section, it opens up, and more text is shown.

Example use case: During a brainstorm session, people go into breakouts. They put ideas on sticky notes. One person draws an idea of an action on paper. They take pictures of the sticky notes and the drawing. Near the end of the breakout, they record a voice note to explain their best ideas.

Then, plenary, the facilitator sends a last voice note to the web app, asking to process all the ideas, and come up with good discussion questions to help move the group forward.

The facilitator can also click the ‘all our files’ button to show everything people submitted on the big screen. AI automatically summarises it, so it can be read from a distance.

# Nuxt Starter Template

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

Use this template to get started with [Nuxt UI](https://ui.nuxt.com) quickly.

- [Live demo](https://starter-template.nuxt.dev/)
- [Documentation](https://ui.nuxt.com/docs/getting-started/installation/nuxt)

<a href="https://starter-template.nuxt.dev/" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ui.nuxt.com/assets/templates/nuxt/starter-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://ui.nuxt.com/assets/templates/nuxt/starter-light.png">
    <img alt="Nuxt Starter Template" src="https://ui.nuxt.com/assets/templates/nuxt/starter-light.png">
  </picture>
</a>

> The starter template for Vue is on https://github.com/nuxt-ui-templates/starter-vue.

## Quick Start

```bash [Terminal]
npm create nuxt@latest -- -t github:nuxt-ui-templates/starter
```

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-name=starter&repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fstarter&demo-image=https%3A%2F%2Fui.nuxt.com%2Fassets%2Ftemplates%2Fnuxt%2Fstarter-dark.png&demo-url=https%3A%2F%2Fstarter-template.nuxt.dev%2F&demo-title=Nuxt%20Starter%20Template&demo-description=A%20minimal%20template%20to%20get%20started%20with%20Nuxt%20UI.)

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
