using Microsoft.AspNetCore.SignalR;
using task6.Models;

namespace task6.Hub
{
    public class PresentationHub: Microsoft.AspNetCore.SignalR.Hub
    {
        public List<Presentation> Presentations { get; set; } = new List<Presentation>();
        public List<User> Users { get; set; } = new List<User>();

        public PresentationHub() 
        {
            Presentations.AddRange(new List<Presentation>() 
            {
                new Presentation()
                {
                    Id = 1, Name = "adssa",
                    Users = new List<User>
                    {
                        new User() { Nickname = "asdsa"}
                    },
                    Slides = new List<Slide>()
                    {
                        new Slide()
                        {
                            Id = 1, Elements = new List<Element>()
                            {
                                new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
                            }
                        },
                        new Slide()
                        {
                            Id = 2, Elements = new List<Element>()
                            {
                                new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
                            }
                        },
                        new Slide()
                        {
                            Id = 3, Elements = new List<Element>()
                            {
                                new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
                            }
                        },
                    }
                },
                new Presentation()
                {
                    Id = 2, Name = "adssa",
                    Users = new List<User>
                    {
                        new User() { Nickname = "asdsa"}
                    },
                    Slides = new List<Slide>()
                    {
                        new Slide()
                        {
                            Id = 1, Elements = new List<Element>()
                            {
                                new Text() {Content = "adasdsa", Position = new Position() {X = 5, Y = 10 } }
                            }
                        }
                    }
                },
            });
        }

        public async Task Register(string userName)
        {

        }

        public async Task CreatePresentation(string name)
        {

        }

        public async Task AddElement()
        {

        }

        public async Task EditElement()
        {

        }

        public async Task DeleteElement()
        {

        }

        public async Task CreateSlide()
        {

        }

        public async Task DeleteSlide()
        {

        }

        public async Task ChangeUserRole()
        {

        }
    }
}
