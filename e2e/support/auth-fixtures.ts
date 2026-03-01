import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_E2E_EMAIL = "e2e.fixture@compass.local";
const DEFAULT_E2E_PASSWORD = "CompassE2E!2026";
const FIXTURE_PREFIX = "E2E Fixture:";

export const E2E_AUTH_EMAIL = process.env.E2E_USER_EMAIL ?? DEFAULT_E2E_EMAIL;
export const E2E_AUTH_PASSWORD =
  process.env.E2E_USER_PASSWORD ?? DEFAULT_E2E_PASSWORD;

type E2EFixtureData = {
  orgId: string;
  userId: string;
  regionTeamId: string;
  seededGoalTitle: string;
  seededWorkItemTitle: string;
  seededCommitmentTitle: string;
  seededStoryTitle: string;
  seededPrayerText: string;
  seededAimTitle: string;
};

function readRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createAdminClient(): SupabaseClient {
  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function ensurePrimaryOrg(admin: SupabaseClient) {
  const { data: appConfig, error: appConfigError } = await admin
    .from("app_config")
    .select("primary_org_id")
    .eq("id", 1)
    .maybeSingle();

  if (appConfigError) {
    throw new Error(
      `Unable to read app configuration: ${appConfigError.message}`
    );
  }

  const existingOrgId = appConfig?.primary_org_id as string | null;
  if (existingOrgId) {
    return existingOrgId;
  }

  const { data: org, error: orgError } = await admin
    .from("orgs")
    .insert({
      slug: "global-fellowship",
      name: "Global Fellowship",
    })
    .select("id")
    .single();

  if (orgError || !org) {
    throw new Error(`Unable to create primary org: ${orgError?.message}`);
  }

  const orgId = org.id as string;
  const { error: appConfigUpsertError } = await admin.from("app_config").upsert(
    {
      id: 1,
      primary_org_id: orgId,
    },
    {
      onConflict: "id",
    }
  );

  if (appConfigUpsertError) {
    throw new Error(
      `Unable to set primary org in app configuration: ${appConfigUpsertError.message}`
    );
  }

  const { error: defaultTeamsError } = await admin.rpc("create_default_teams", {
    p_org_id: orgId,
  });
  if (defaultTeamsError) {
    throw new Error(
      `Unable to create default teams for primary org: ${defaultTeamsError.message}`
    );
  }

  return orgId;
}

async function ensureRegionTeam(admin: SupabaseClient, orgId: string) {
  const { data: existingRegion } = await admin
    .from("teams")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", "europe")
    .eq("type", "region")
    .maybeSingle();

  if (existingRegion?.id) {
    return existingRegion.id as string;
  }

  const { data: team, error: teamError } = await admin
    .from("teams")
    .insert({
      org_id: orgId,
      type: "region",
      slug: "europe",
      name: "Europe",
    })
    .select("id")
    .single();

  if (teamError || !team) {
    throw new Error(`Unable to ensure region team: ${teamError?.message}`);
  }

  return team.id as string;
}

async function ensureAuthUser(
  admin: SupabaseClient,
  email: string,
  password: string
) {
  const { data: usersPage, error: listUsersError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
  if (listUsersError) {
    throw new Error(`Unable to list auth users: ${listUsersError.message}`);
  }

  const existingUser = usersPage.users.find((user) => user.email === email);
  if (existingUser) {
    const { error: updateUserError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: "E2E Fixture User",
          name: "E2E Fixture User",
        },
      }
    );
    if (updateUserError) {
      throw new Error(
        `Unable to update fixture auth user: ${updateUserError.message}`
      );
    }

    return existingUser.id;
  }

  const { data: createdUser, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "E2E Fixture User",
        name: "E2E Fixture User",
      },
    });
  if (createUserError || !createdUser.user) {
    throw new Error(
      `Unable to create fixture auth user: ${createUserError?.message}`
    );
  }

  return createdUser.user.id;
}

async function ensureProfileAndAccess({
  admin,
  userId,
  orgId,
  regionTeamId,
}: {
  admin: SupabaseClient;
  userId: string;
  orgId: string;
  regionTeamId: string;
}) {
  const baseProfilePayload = {
    user_id: userId,
    org_id: orgId,
    email: E2E_AUTH_EMAIL,
    full_name: "E2E Fixture User",
    timezone: "UTC",
    is_active: true,
  };

  const { error: initialProfileError } = await admin.from("profiles").upsert(
    {
      ...baseProfilePayload,
    },
    {
      onConflict: "user_id",
    }
  );

  const needsLegacyProfileId =
    initialProfileError?.message.includes('null value in column "id"') ?? false;

  if (needsLegacyProfileId) {
    const { error: legacyProfileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        ...baseProfilePayload,
      },
      {
        onConflict: "user_id",
      }
    );
    if (legacyProfileError) {
      throw new Error(
        `Unable to upsert fixture profile (legacy schema): ${legacyProfileError.message}`
      );
    }
  } else if (initialProfileError) {
    throw new Error(
      `Unable to upsert fixture profile: ${initialProfileError.message}`
    );
  }

  const { error: membershipError } = await admin
    .from("team_memberships")
    .upsert(
      {
        org_id: orgId,
        team_id: regionTeamId,
        user_id: userId,
        is_primary: true,
      },
      {
        onConflict: "team_id,user_id",
      }
    );
  if (membershipError) {
    throw new Error(
      `Unable to upsert fixture team membership: ${membershipError.message}`
    );
  }

  const { data: existingOrgAdminRole, error: existingOrgAdminRoleError } =
    await admin
      .from("role_assignments")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("role", "admin")
      .is("team_id", null)
      .maybeSingle();
  if (existingOrgAdminRoleError) {
    throw new Error(
      `Unable to query existing org admin role assignment: ${existingOrgAdminRoleError.message}`
    );
  }

  if (!existingOrgAdminRole) {
    const { error: roleAssignmentError } = await admin
      .from("role_assignments")
      .insert({
        org_id: orgId,
        user_id: userId,
        role: "admin",
        team_id: null,
      });
    if (roleAssignmentError) {
      throw new Error(
        `Unable to create fixture role assignment: ${roleAssignmentError.message}`
      );
    }
  }
}

async function clearPreviousFixtures({
  admin,
  orgId,
  userId,
}: {
  admin: SupabaseClient;
  orgId: string;
  userId: string;
}) {
  await admin
    .from("work_items")
    .delete()
    .eq("org_id", orgId)
    .eq("owner_user_id", userId)
    .ilike("title", `${FIXTURE_PREFIX}%`);

  await admin
    .from("goals")
    .delete()
    .eq("org_id", orgId)
    .or(`scope_user_id.eq.${userId},created_by.eq.${userId}`)
    .ilike("title", `${FIXTURE_PREFIX}%`);

  await admin
    .from("commitments")
    .delete()
    .eq("owner_user_id", userId)
    .ilike("title", `${FIXTURE_PREFIX}%`);

  await admin
    .from("measures")
    .delete()
    .eq("owner_user_id", userId)
    .ilike("name", `${FIXTURE_PREFIX}%`);

  await admin
    .from("aims")
    .delete()
    .eq("owner_user_id", userId)
    .ilike("title", `${FIXTURE_PREFIX}%`);

  await admin.from("stories").delete().ilike("title", `${FIXTURE_PREFIX}%`);
  await admin.from("prayer_items").delete().ilike("text", `${FIXTURE_PREFIX}%`);
  await admin
    .from("missionaries")
    .delete()
    .eq("org_id", orgId)
    .ilike("code_name", `${FIXTURE_PREFIX}%`);
}

async function insertSeedData({
  admin,
  orgId,
  userId,
  regionTeamId,
}: {
  admin: SupabaseClient;
  orgId: string;
  userId: string;
  regionTeamId: string;
}): Promise<E2EFixtureData> {
  const seededAimTitle = `${FIXTURE_PREFIX} Strengthen field coaching loops`;
  const seededCommitmentTitle = `${FIXTURE_PREFIX} Prepare weekly field coaching agenda`;
  const seededGoalTitle = `${FIXTURE_PREFIX} Advance team prayer rhythm`;
  const seededWorkItemTitle = `${FIXTURE_PREFIX} Draft weekly prayer coaching plan`;
  const seededStoryTitle = `${FIXTURE_PREFIX} Local leader multiplied disciple groups`;
  const seededPrayerText = `${FIXTURE_PREFIX} Pray for discernment in region coaching visits`;

  const { data: aim, error: aimError } = await admin
    .from("aims")
    .insert({
      org_id: orgId,
      scope: "user",
      owner_user_id: userId,
      title: seededAimTitle,
      classification: "normal",
      created_by: userId,
    })
    .select("id")
    .single();
  if (aimError || !aim) {
    throw new Error(`Unable to seed fixture aim: ${aimError?.message}`);
  }

  const { data: measure, error: measureError } = await admin
    .from("measures")
    .insert({
      org_id: orgId,
      aim_id: aim.id as string,
      kind: "lead",
      owner_user_id: userId,
      name: `${FIXTURE_PREFIX} Weekly coaching sessions completed`,
      cadence: "weekly",
      unit: "count",
      baseline: 3,
      target: 6,
      confidence_score: 4,
      definition_text:
        "Count of completed partner coaching sessions in the current week.",
      created_by: userId,
    })
    .select("id")
    .single();
  if (measureError || !measure) {
    throw new Error(`Unable to seed fixture measure: ${measureError?.message}`);
  }

  const { error: commitmentError } = await admin.from("commitments").insert({
    org_id: orgId,
    aim_id: aim.id as string,
    measure_id: measure.id as string,
    owner_user_id: userId,
    team_id: regionTeamId,
    title: seededCommitmentTitle,
    status: "planned",
    priority_rank: 1,
    weight: 75,
    classification: "normal",
    created_by: userId,
  });
  if (commitmentError) {
    throw new Error(
      `Unable to seed fixture commitment: ${commitmentError.message}`
    );
  }

  const { error: storyError } = await admin.from("stories").insert({
    org_id: orgId,
    team_id: regionTeamId,
    aim_id: aim.id as string,
    author_user_id: userId,
    type: "quick",
    title: seededStoryTitle,
    body_json: {
      text: "A partner church launched two reproducible discipleship circles this month.",
    },
    tags: ["e2e", "story"],
    classification: "normal",
  });
  if (storyError) {
    throw new Error(`Unable to seed fixture story: ${storyError.message}`);
  }

  const { error: prayerError } = await admin.from("prayer_items").insert({
    org_id: orgId,
    team_id: regionTeamId,
    owner_user_id: userId,
    text: seededPrayerText,
    status: "open",
    classification: "normal",
  });
  if (prayerError) {
    throw new Error(
      `Unable to seed fixture prayer item: ${prayerError.message}`
    );
  }

  const { error: missionaryError } = await admin.from("missionaries").insert({
    org_id: orgId,
    region_team_id: regionTeamId,
    code_name: `${FIXTURE_PREFIX} Cedar Lantern`,
    public_name: null,
    status: "active",
    location_text: "Restricted",
    classification: "sensitive",
  });
  if (missionaryError) {
    throw new Error(
      `Unable to seed fixture missionary record: ${missionaryError.message}`
    );
  }

  const { data: goal, error: goalError } = await admin
    .from("goals")
    .insert({
      org_id: orgId,
      scope_type: "user",
      scope_team_id: regionTeamId,
      scope_user_id: userId,
      title: seededGoalTitle,
      description_text: "Fixture goal used for workboard and goals v2 flows.",
      status: "active",
      timebox_type: "quarterly",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 89)
        .toISOString()
        .slice(0, 10),
      visibility: "private",
      classification: "normal",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (goalError || !goal) {
    throw new Error(`Unable to seed fixture goal: ${goalError?.message}`);
  }

  const { data: workItem, error: workItemError } = await admin
    .from("work_items")
    .insert({
      org_id: orgId,
      type: "task",
      title: seededWorkItemTitle,
      description_text: "Fixture work item for board movement tests.",
      status_key: "backlog",
      priority: "high",
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
        .toISOString()
        .slice(0, 10),
      owner_user_id: userId,
      team_id: regionTeamId,
      created_by: userId,
      updated_by: userId,
      visibility: "team",
      classification: "normal",
    })
    .select("id")
    .single();
  if (workItemError || !workItem) {
    throw new Error(
      `Unable to seed fixture work item: ${workItemError?.message}`
    );
  }

  const { error: goalLinkError } = await admin
    .from("work_item_goal_links")
    .insert({
      org_id: orgId,
      work_item_id: workItem.id as string,
      goal_id: goal.id as string,
      is_primary: true,
      created_by: userId,
    });
  if (goalLinkError) {
    throw new Error(
      `Unable to seed fixture work item goal link: ${goalLinkError.message}`
    );
  }

  const { error: assigneeError } = await admin
    .from("work_item_assignees")
    .upsert(
      {
        org_id: orgId,
        work_item_id: workItem.id as string,
        user_id: userId,
        created_by: userId,
      },
      { onConflict: "work_item_id,user_id" }
    );
  if (assigneeError) {
    throw new Error(
      `Unable to seed fixture work item assignee: ${assigneeError.message}`
    );
  }

  const { data: board, error: boardError } = await admin
    .from("boards")
    .select("id")
    .eq("org_id", orgId)
    .eq("type", "user")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (boardError) {
    throw new Error(`Unable to load fixture board: ${boardError.message}`);
  }
  if (board?.id) {
    const { data: backlogColumn, error: backlogColumnError } = await admin
      .from("board_columns")
      .select("id")
      .eq("org_id", orgId)
      .eq("board_id", board.id as string)
      .eq("key", "backlog")
      .single();

    if (backlogColumnError || !backlogColumn) {
      throw new Error(
        `Unable to load fixture board backlog column: ${backlogColumnError?.message}`
      );
    }

    const { error: boardStateError } = await admin
      .from("work_item_board_state")
      .upsert(
        {
          org_id: orgId,
          board_id: board.id as string,
          work_item_id: workItem.id as string,
          column_id: backlogColumn.id as string,
          position: 1000,
          pinned: true,
        },
        { onConflict: "board_id,work_item_id" }
      );
    if (boardStateError) {
      throw new Error(
        `Unable to seed fixture board state: ${boardStateError.message}`
      );
    }
  }

  return {
    orgId,
    userId,
    regionTeamId,
    seededGoalTitle,
    seededWorkItemTitle,
    seededCommitmentTitle,
    seededStoryTitle,
    seededPrayerText,
    seededAimTitle,
  };
}

let cachedFixturePromise: Promise<E2EFixtureData> | null = null;

export async function ensureAuthFixtureData() {
  if (!cachedFixturePromise) {
    cachedFixturePromise = (async () => {
      const admin = createAdminClient();
      const orgId = await ensurePrimaryOrg(admin);
      const regionTeamId = await ensureRegionTeam(admin, orgId);
      const userId = await ensureAuthUser(
        admin,
        E2E_AUTH_EMAIL,
        E2E_AUTH_PASSWORD
      );

      await ensureProfileAndAccess({ admin, userId, orgId, regionTeamId });
      await clearPreviousFixtures({ admin, orgId, userId });

      return insertSeedData({ admin, orgId, userId, regionTeamId });
    })();
  }

  return cachedFixturePromise;
}
