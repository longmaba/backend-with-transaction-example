<!DOCTYPE html>
<html>
<head>
  <title></title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<div class="container">
  {{#if errors.length}}
  <div class="text text-danger">
    <h3>Problem found: {{errors.length}}</h3>
    <ul>
      {{#each errors}}
        <li>
          <div>{{this.serviceName}}: {{this.status}}</div>
          <pre>
{{this.error.stack}}
          </pre>
        </li>
      {{/each}}
    </ul>
  </div>
  {{/if}}

  {{#each plugins}}
  <div>
    <h3>{{@key}}</h3><em>@path {{this.path}}</em>
    <table class="table table-striped table-hover table-compact">
      <tr>
        <th class="col-md-1 text-center">E</th>
        <th class="col-md-3">Name</th>
        <th class="col-md-6">Requirements</th>
        <th class="col-md-2">Status</th>
      </tr>
      {{#each this.services}}
      <tr>
        <td class="text-center">
        {{#if this.export}}
          <i class="fa fa-check text-success" aria-hidden="true"></i>
        {{else}}
          <i class="fa fa-times text-muted" aria-hidden="true"></i>
        {{/if}}
        </td>
        <td>{{@key}}</td>
        <td>
        {{#each this.requirements}}
        <div style="font-weight: bold">
          {{#switch this.status}}
            {{#case "lib"}}<span class="text text-muted">{{this.dep}}</span>{{/case}}
            {{#case "pending" "resolved"}}<span class="text-warning">{{this.dep}}</span>{{/case}}
            {{#case "error" "unresolvable" "missing"}}<span class="text-danger">{{this.dep}}</span>{{/case}}
            {{#case "ready"}}<span class="text-success">{{this.dep}}</span>{{/case}}      
          {{/switch}}
        </div>
        {{/each}}
        </td>
        <td>
        {{#switch this.status}}
          {{#case "pending" "resolved"}}<span class="label label-warning">{{this.status}}</span>{{/case}}
          {{#case "error" "unresolvable"}}<span class="label label-danger">{{this.status}}</span>{{/case}}
          {{#case "ready"}}<span class="label label-success">{{this.status}}</span>{{/case}}
        {{/switch}}
        </td>
      </tr>
      {{/each}}
    </table>
  </div>
  {{/each}}
</div>
</body>
</html>