# BCQuality tools

- `config.js`: read-only, shared YAML normalizer. Node plus the declared ALDC
  `js-yaml` dependency; no provider discovery, installation or invocation.
- `install.sh` / `install.ps1`: explicit external-multiroot setup. Disabled or
  plugin mode stops before Git operations. Configuration comes from the normalizer.
- `validate_evidence.py`: report shape and citation paths against an available
  corpus; never proves plugin execution. Missing corpus is UNVERIFIED. Plugin
  mode needs an explicit `--bcquality-root`; legacy `home` is not substituted.
- `precondition_hook.sh` / `.ps1`: compatibility notices pointing to the shared
  contract, with no provider probe. Claude registers the shell hook; other hosts
  consume the agent contract without assuming hook support.

The only configuration source is project `external.bcquality`; there are no
hardcoded duplicate pins. See [setup and limits](../../docs/bcquality.md) and
[the shared contract](../../docs/templates/bcquality-provider-contract.md).
