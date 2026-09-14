# ALDC for Visual Studio Code

The VS Code extension installs ALDC agents, workflows, instructions and skills
into a Business Central workspace. Its package and Marketplace publication are
versioned separately from changes in the canonical repository.

## Installation behavior

Use **AL Collection: Install Toolkit to Workspace** to install the toolkit.
A profile-enabled extension offers BC28-compatible and BC29-native content. The
selected profile changes agent/tool contracts; it does not upgrade Business Central,
AL Language, project runtime or dependencies.

Current transactional installers update recognized, unchanged files and report
personalized files as collisions. Replacing customizations requires explicit
confirmation and creates a recoverable backup. Verification compares installed
files with the receipt; restoration protects subsequent edits.

Commands depend on the installed extension version. New repository capabilities
are available through an extension only after that content is packaged and installed.
A source change is not an automatic Marketplace update.

## Content and requirements

The extension packages canonical Foundation content, document templates, native
AL tool guidance and the installer. Doctor requires an available Python 3.9+
interpreter. Copilot and a compatible AL Language installation supply the host
capabilities; ALDC does not install or authenticate them on the user's behalf.

See [profiles](native-bc29.md), [installation and recovery](plugin-packaging.md)
and [Spec Agent](spec-agent.md) for product behavior.
