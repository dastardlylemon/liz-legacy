export default (active) => `
  <li id="liz_dashboard_nav"${active ? ' class="active"' : ''}>
    <a class="list-link js-nav" href="/settings/liz" data-nav="liz">
      Liz
      <span class="Icon Icon--caretRight"></span>
    </a>
  </li>
`;
