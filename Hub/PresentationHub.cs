using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using task6.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace task6.Hub
{
    public class PresentationState
    {
        public List<Presentation> Presentations { get; set; } = new List<Presentation>();

        public Dictionary<string, string> UserToPresentationMap { get; set; } = new Dictionary<string, string>();

        public List<User> Users { get; set; } = new List<User>();
        public Dictionary<string, bool> AdminEnterAfterCreate { get; set; } = new Dictionary<string, bool>();
    }

    public class PresentationHub: Microsoft.AspNetCore.SignalR.Hub
    {
        public readonly PresentationState _state;
        private readonly IHubContext<PresentationHub> _hubContext;

        public PresentationHub(PresentationState state, IHubContext<PresentationHub> hubContext)
        {
            _state = state;
            _hubContext = hubContext;
        }
        //public PresentationHub() 
        //{
        //    Presentations.AddRange(new List<Presentation>() 
        //    {
        //        new Presentation()
        //        {
        //            Id = Guid.NewGuid().ToString(), Name = "adssa",
        //            Users = new List<User>
        //            {
        //                new User() { Nickname = "asdsa"}
        //            },
        //            Slides = new List<Slide>()
        //            {
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                },
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                },
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                },
        //            }
        //        },
        //        new Presentation()
        //        {
        //            Id = Guid.NewGuid().ToString(), Name = "adsasdsa",
        //            Users = new List<User>
        //            {
        //                new User() { Nickname = "asdsa"}
        //            },
        //            Slides = new List<Slide>()
        //            {
        //                new Slide()
        //                {
        //                    Id = Guid.NewGuid().ToString(), Elements = new List<Element>()
        //                    {
        //                        new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
        //                    }
        //                }
        //            }
        //        },
        //    });
        //}
        public async Task JoinPresentation(string presentationId, string userName)
        {
            var findPres = _state.Presentations.First(x => x.Id == presentationId);
            if (findPres != null)
            {
                if (!findPres.Users.Any(r => r.Nickname == userName))
                {
                    if (_state.AdminEnterAfterCreate[presentationId] == false)
                    {
                        findPres.Users.Add(new User
                        {
                            ConnectionId = Context.ConnectionId,
                            Nickname = userName,
                            Role = UserType.Owner,
                        });
                        _state.AdminEnterAfterCreate[presentationId] = true;
                    }
                    else
                    {
                        findPres.Users.Add(new User
                        {
                            ConnectionId = Context.ConnectionId,
                            Nickname = userName,
                            Role = UserType.Viewer,
                        });
                    }
                }
                else
                {
                    findPres.Users.Find(x => x.Nickname == userName)!.ConnectionId=Context.ConnectionId;
                }


                //await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize(findPres));
                await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == presentationId).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveUpdate", JsonSerializer.Serialize(findPres));
            }
        }

        public async Task<string?> CreatePresentation(string presentationName, string userName)
        {
            if (_state.Presentations.Any(p => p.Name == presentationName))
            {
                return null;
            }
            var presentationId = Guid.NewGuid().ToString();
            var presentation = new Presentation
            {
                Id = presentationId,
                Name = presentationName,
                Users = new List<User>
                {
                    new User
                    {
                        ConnectionId = Context.ConnectionId,
                        Nickname = userName,
                        Role = UserType.Owner,
                        
                    }
                }
            };
            _state.AdminEnterAfterCreate.Add(presentationId, false);
            _state.Presentations.Add(presentation);

            await _hubContext.Clients.AllExcept($"{Context.ConnectionId}").SendAsync("PresentationAdded", new { Id = presentationId, Name = presentationName });
            return presentationId;
        }
        public async Task AddSlide(string presentationId, string? position = null)
        {
            var presentation = _state.Presentations.FirstOrDefault(p => p.Id == presentationId);
            if (presentation != null)
            {
                var newSlide = new Slide
                {
                    Id = Guid.NewGuid().ToString(),
                    Elements = new List<Element>()
                };

                if (position != null)
                {
                    presentation.Slides.Insert(presentation.Slides.FindIndex(x => x.Id == position), newSlide);
                }
                else
                {
                    presentation.Slides.Add(newSlide);
                }

                //await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(presentation));
                await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == presentationId).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveUpdate", JsonSerializer.Serialize(presentation));
            }
        }

        public async Task DeleteSlide(string presentationId, string slideId)
        {
            var presentation = _state.Presentations.FirstOrDefault(p => p.Id == presentationId);
            if (presentation != null)
            {
                var slide = presentation.Slides.FirstOrDefault(s => s.Id == slideId);
                if (slide != null)
                {
                    presentation.Slides.Remove(slide);

                    //await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(presentation));
                    await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == presentationId).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveUpdate", JsonSerializer.Serialize(presentation));
                }
            }
        }

        public async Task ChangeRole(string presentationId, string targetUserName, UserType role)
        {
            var findPres = _state.Presentations.First(x => x.Id == presentationId);
            if (findPres != null)
            {
                var user = findPres.Users.FirstOrDefault(r => r.Nickname == targetUserName);
                if (user != null)
                {
                    if (user.Role != role)
                    {
                        user.Role = role;
                        //await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(findPres));
                        await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == presentationId).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveUpdate", JsonSerializer.Serialize(findPres));
                    }
                }
            }
        }
        public async Task UpdatePresentation(string data)
        {
            Presentation pres = JsonSerializer.Deserialize<Presentation>(data);
            var presToChange = _state.Presentations.First(x => x.Id == pres.Id);
            presToChange.Users = pres.Users;
            presToChange.Slides = pres.Slides;
            presToChange.Name = pres.Name;

            //await _hubContext.Clients.All.SendAsync("ReceiveUpdate", data);
            await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == pres.Id).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveUpdate", data);
        }

        public async Task CheckGroupMembership(string groupId)
        {
            Console.WriteLine($"Broadcasting to group {groupId}");
            await Clients.Group(groupId).SendAsync("TestGroup", "Test message");
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            //Console.WriteLine($"Connected {Context.GetHttpContext()?.Request?.Query?.First(x => x.Key=="nickName").Value}" + Context.ConnectionId);
        }
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var id = Context.ConnectionId;
            var pres = _state.Presentations.First(x => x.Users.Any(y => y.ConnectionId == id));
            if (_state.AdminEnterAfterCreate.ContainsKey(pres.Id) && _state.AdminEnterAfterCreate[pres.Id] == false)
            {
                _state.AdminEnterAfterCreate[pres.Id] = true;
                return;
            }
            var user = pres.Users.First(x => x.ConnectionId == id);
            RemoveUserFromPresentation(pres.Id, user.Nickname);
            await base.OnDisconnectedAsync(exception);
        }
        public async void RemoveUserFromPresentation(string presentationId, string userNickName)
        {
            if (_state.Presentations.First(x => x.Id == presentationId).Users.Any(y => y.Nickname == userNickName))
            {
                var users = _state.Presentations.First(x => x.Id == presentationId).Users;
                var exactUser = users.Find(x => x.Nickname == userNickName);
                //if (exactUser.Role == UserType.Owner && _state.Presentations.First(x => x.Id == presentationId).Users.Count == 1)
                //{
                //    users.RemoveAll(x => x.Nickname == userNickName);
                //}
                //else if (exactUser.Role != UserType.Owner && _state.Presentations.First(x => x.Id == presentationId).Users.Count != 1)
                //{
                //    users.RemoveAll(x => x.Nickname == userNickName);
                //}
                users.RemoveAll(x => x.Nickname == userNickName);
                //await _hubContext.Clients.All.SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(_state.Presentations.First(x => x.Id == presentationId)));
                await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == presentationId).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveUpdate", JsonSerializer.Serialize<Presentation>(_state.Presentations.First(x => x.Id == presentationId)));

                if (users.Count == 0)
                {
                    _state.Presentations.RemoveAll(x => x.Id == presentationId);
                    await _hubContext.Clients.AllExcept($"{Context.ConnectionId}").SendAsync("PresentationDeleted", new { Id = presentationId });
                    return;
                }
            }
        }
        public async Task GetSlidesMemoryUsage(string presentationId)
        {
            var size = System.Text.Encoding.UTF8.GetByteCount(JsonSerializer.Serialize(_state.Presentations.Find(x => x.Id == presentationId))); // будет больше реальной
            await _hubContext.Clients.Clients(_state.Presentations.First(x => x.Id == presentationId).Users.Select(y => y.ConnectionId)).SendAsync("ReceiveSize", size);
        }
    }
}
