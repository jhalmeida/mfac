import {createSelector} from 'reselect';
import _values from 'lodash/values';
import _sortBy from 'lodash/sortBy';
import _orderBy from 'lodash/orderBy';


export const getUi = createSelector(
  (state, params = {}) => {
    return state.ui
  },
  ui => ui,
)

export const getSnackbar = createSelector(
  (state, params = {}) => {
    return state.ui.snackbar;
  },
  snackbar => snackbar,
)

export const getNavDrawer = createSelector(
  (state, params = {}) => {
    return state.ui.navDrawer;
  },
  navDrawer => navDrawer,
)

export const getHeader = createSelector(
  (state, params = {}) => {
    return state.ui.header;
  },
  header => header,
)

export const getProposals = createSelector(
  (state, params = {}) => {
    const {agenda_item_id} = params;
    if (!agenda_item_id) {throw new Error('agenda_item_id is required')};
    const agenda_item = state.agendaItems.cache[agenda_item_id];
    if (!agenda_item) {return []};
    const asArray = _values(agenda_item.proposals);
    const sorted = _orderBy(asArray, ['inserted_at'], ['asc']);
    return sorted;
  },
  proposals => proposals,
)

export const getProposal = createSelector(
  (state, params = {}) => {
    const {agenda_item_id, proposal_id} = params;
    if (!(agenda_item_id && proposal_id)) {throw new Error('agenda_item_id and proposal_id are required')};
    const agenda_item = state.agendaItems.cache[agenda_item_id];
    if (!agenda_item) {return null};
    const proposal = agenda_item.proposals[proposal_id];
    return proposal;
  },
  proposal => proposal,
)

export const getAmendments = createSelector(
  (state, params = {}) => {
    const {
      agenda_item_id,
      proposal_id,
    } = params;
    if (!(agenda_item_id && proposal_id)) {throw new Error('agenda_item_id and proposal_id are required')};
    const agenda_item = state.agendaItems.cache[agenda_item_id];
    if (!agenda_item) {return []};
    const proposal = agenda_item.proposals[proposal_id];
    if (!proposal) {return []};
    const asArray = _values(proposal.amendments);
    const sorted = _orderBy(asArray, ['inserted_at'], ['asc']);
    return sorted;
  },
  amendments => amendments,
)

export const getAmendment = createSelector(
  (state, params = {}) => {
    const {
      agenda_item_id, 
      proposal_id,
      amendment_id,
    } = params;
    if (!(agenda_item_id && proposal_id && amendment_id)) {throw new Error('agenda_item_id, proposal_id, and amendment_id are required')};
    const agenda_item = state.agendaItems.cache[agenda_item_id];
    if (!agenda_item) {return null};
    const proposal = agenda_item.proposals[proposal_id];
    if (!proposal) {return null};
    const amendment = proposal.amendments[amendment_id];
    return amendment;
  },
  amendment => amendment,
)

export const getMeetingParticipants = createSelector(
  (state, params = {}) => {
    // don't display current user in
    // meeting participants
    const {userData} = state.session;
    const items = state.meetingParticipants.cache;
    let asArray = _values(items);
    asArray = asArray.filter(i => i.id !== userData.id);
    const sorted = _orderBy(asArray, ['full_name'], ['desc']);
    return sorted;
  },
  meetingParticipants => meetingParticipants,
)

export const getMeetingInvitations = createSelector(
  (state, params = {}) => {
    const items = state.meetingInvitations.cache;
    const asArray = _values(items);
    const sorted = _orderBy(asArray, ['inserted_at'], ['asc']);
    return sorted;
  },
  meetingInvitations => meetingInvitations,
)

export const getMeetingInvitation = createSelector(
  (state, params = {}) => {
    const {meeting_invitation_id} = params;
    return state.meetingInvitations.cache[meeting_invitation_id];
  },
  meetingInvitation => meetingInvitation,
)

export const getUserMeetingInvitations = createSelector(
  (state, params = {}) => {
    const items = state.session.meetingInvitations;
    const asArray = _values(items);
    const sorted = _orderBy(asArray, ['inserted_at'], ['asc']);
    return sorted;
  },
  meetingInvitations => meetingInvitations,
)

export const getUserMeetingInvitation = createSelector(
  (state, params = {}) => {
    const {meeting_invitation_id} = params;
    return state.session.meetingInvitations[meeting_invitation_id];
  },
  meetingInvitation => meetingInvitation,
)

export const getIsUserLoggedIn = createSelector(
  (state, params = {}) => {
    return state.session.isLoggedIn;
  },
  isLoggedIn => isLoggedIn,
)

export const getUserData = createSelector(
  (state, params = {}) => {
    return state.session.userData;
  },
  userData => userData,
)

export const getUserContacts = createSelector(
  (state, params = {}) => {
    const {contacts} = state.session;
    const asArray = _values(contacts);
    return asArray;
  },
  contacts => contacts,
)

export const getUninvitedContacts = createSelector(
  getUserContacts,
  getMeetingInvitations,
  (contacts, invitations) => {
    const result = contacts.filter(c => {
      for (let i = 0; i < invitations.length; i++) {
        if (invitations[i].invitee.id === c.id) {
          return false;
        }
      }
      return true;
    })
    return result;
  },
)

export const getMeeting = createSelector(
  (state, params = {}) => {
    let {meeting_id} = params
    if (meeting_id) {
      meeting_id = parseInt(meeting_id, 10);
      return state.meetings.cache[params.meeting_id];
    }
    // default is get currently selected meeting
    else {
      meeting_id = state.meetings.selected;
      return state.meetings.cache[meeting_id];
    }
  },
  meeting => meeting,
)

export const getMeetings = createSelector(
  (state, params = {}) => {
    // todo: allow for different sorting criteria
    // to be passed as params
    const {sortCriteria} = params;

    const cache = state.meetings.cache;
    const asArray = _values(cache);
    const sorted = _orderBy(asArray, ['inserted_at'], ['asc']);
    return sorted;
  },
  meetings => meetings,
)

export const getAgendaItems = createSelector(
  (state, params = {}) => {
    // todo: allow for different sorting criteria
    // to be passed as params
    const {sortCriteria} = params;
    const cache = state.agendaItems.cache;
    const asArray = _values(cache);

    //let sorted = _sortBy(asArray, ['inserted_at'], ['asc']);

    let sorted = _sortBy(asArray, 
      (item => {
        const {up, down} = item.votes;
        const net_total = up - down;
        return net_total;
      })
    );
    // reverse array so that items are
    // in desc order (I don't believe this
    // can be accomplished in _sortBy.  It
    // can be accomplished with _orderBy,
    // but I don't think you can pass a func
    // to orderBy like you can with sortBy)
    sorted.reverse();
    return sorted; 
  },
  agendaItems => agendaItems,
)

export const getFilteredAgendaItems = createSelector(
  (state, params = {}) => {
    const {status} = params;
    const cache = state.agendaItems.cache;
    const asArray = _values(cache);

    const items = asArray.filter(a => a.status === status);

    let sorted = _sortBy(items, 
      (item => {
        const {up, down} = item.votes;
        const net_total = up - down;
        return net_total;
      })
    );
    // reverse array so that items are
    // in desc order (I don't believe this
    // can be accomplished in _sortBy.  It
    // can be accomplished with _orderBy,
    // but I don't think you can pass a func
    // to orderBy like you can with sortBy)
    sorted.reverse();
    return sorted; 
  },
  agendaItems => agendaItems,
)


export const getAgendaItem = createSelector(
  (state, params = {}) => {
    let {agenda_item_id} = params
    if (agenda_item_id) {
      agenda_item_id = parseInt(agenda_item_id, 10);
      const a = state.agendaItems.cache[agenda_item_id];
      return state.agendaItems.cache[agenda_item_id];
    }
    // default: get currently selected meeting
    else {
      agenda_item_id = state.agendaItems.selected;
      return state.agendaItems.cache[agenda_item_id];
    }
  },
  meeting => meeting,
)

export const getIsUserInStack = createSelector(
  getUserData,
  getAgendaItem,
  (userData, agendaItem) => {
    if (!userData || !agendaItem) {
      return false;
    }
    const ses = agendaItem.stack_entries;
    for (var i = 0; i < ses.length; i++) {
      const se = ses[i];
      if (se.owner.id === userData.id) {
        return true;
      }
    }
    return false;
  },
)




export const getTopic = createSelector(
  (state, params = {}) => {
    const topic_id = parseInt(params.topic_id, 10)
    return state.topics.cache[params.topic_id];
  },
  topic => topic,
)

export const getTopics = createSelector(
  (state, params = {}) => {
    // todo: allow for different sorting criteria
    // to be passed as params
    const {sortCriteria} = params;

    const cache = state.topics.cache;
    const asArray = _values(cache);
    let sorted = [];

    if (sortCriteria === 'votes') {
      // sorting by basic algorithm below so
      // that items rearrange themselves
      sorted = _orderBy(asArray, (e) => e.votes.up - e.votes.down + 0.25 * e.votes.meh, ['desc'])
    }
    else {
      sorted = _orderBy(asArray, ['inserted_at'], ['asc']);
    }
    return sorted;
  },
  topics => topics,
)


